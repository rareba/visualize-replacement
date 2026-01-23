"""
SQL Parser for converting SQL queries to an intermediate representation.
"""

import logging
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any, Union
from enum import Enum

import sqlparse
from sqlparse.sql import (
    IdentifierList,
    Identifier,
    Where,
    Comparison,
    Token,
    Parenthesis,
    Function,
)
from sqlparse.tokens import Keyword, DML, Wildcard, Name, String, Number

logger = logging.getLogger(__name__)


class AggregateFunction(str, Enum):
    """Supported SQL aggregate functions."""
    COUNT = "COUNT"
    SUM = "SUM"
    AVG = "AVG"
    MIN = "MIN"
    MAX = "MAX"


class ComparisonOperator(str, Enum):
    """Supported SQL comparison operators."""
    EQ = "="
    NE = "!="
    LT = "<"
    LE = "<="
    GT = ">"
    GE = ">="
    LIKE = "LIKE"
    IN = "IN"
    IS_NULL = "IS NULL"
    IS_NOT_NULL = "IS NOT NULL"


@dataclass
class SelectColumn:
    """Represents a column in SELECT clause."""
    name: str
    alias: Optional[str] = None
    aggregate: Optional[AggregateFunction] = None
    distinct: bool = False


@dataclass
class WhereCondition:
    """Represents a condition in WHERE clause."""
    column: str
    operator: ComparisonOperator
    value: Any
    is_and: bool = True  # True for AND, False for OR


@dataclass
class OrderByColumn:
    """Represents a column in ORDER BY clause."""
    column: str
    ascending: bool = True


@dataclass
class ParsedQuery:
    """Intermediate representation of a parsed SQL query."""
    columns: List[SelectColumn] = field(default_factory=list)
    table: Optional[str] = None
    table_alias: Optional[str] = None
    where_conditions: List[WhereCondition] = field(default_factory=list)
    group_by: List[str] = field(default_factory=list)
    having_conditions: List[WhereCondition] = field(default_factory=list)
    order_by: List[OrderByColumn] = field(default_factory=list)
    limit: Optional[int] = None
    offset: Optional[int] = None
    distinct: bool = False


class SQLParser:
    """Parser for SQL SELECT queries."""

    def parse(self, sql: str) -> ParsedQuery:
        """
        Parse a SQL SELECT query into an intermediate representation.

        Args:
            sql: The SQL query string

        Returns:
            ParsedQuery object containing the parsed query structure
        """
        logger.debug(f"Parsing SQL: {sql}")

        # Parse with sqlparse
        parsed = sqlparse.parse(sql)
        if not parsed:
            raise SQLParseError("Failed to parse SQL query")

        statement = parsed[0]

        # Ensure it's a SELECT statement
        if statement.get_type() != "SELECT":
            raise SQLParseError(f"Only SELECT statements are supported, got: {statement.get_type()}")

        result = ParsedQuery()

        # Track current position in tokens
        tokens = [t for t in statement.tokens if not t.is_whitespace]
        token_idx = 0

        # Parse SELECT clause
        token_idx = self._parse_select_clause(tokens, token_idx, result)

        # Parse FROM clause
        token_idx = self._parse_from_clause(tokens, token_idx, result)

        # Parse WHERE clause (if present)
        token_idx = self._parse_where_clause(tokens, token_idx, result)

        # Parse GROUP BY clause (if present)
        token_idx = self._parse_group_by_clause(tokens, token_idx, result)

        # Parse HAVING clause (if present)
        token_idx = self._parse_having_clause(tokens, token_idx, result)

        # Parse ORDER BY clause (if present)
        token_idx = self._parse_order_by_clause(tokens, token_idx, result)

        # Parse LIMIT clause (if present)
        token_idx = self._parse_limit_clause(tokens, token_idx, result)

        logger.debug(f"Parsed query: {result}")
        return result

    def _parse_select_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the SELECT clause and return the next token index."""
        # Skip SELECT keyword
        while idx < len(tokens):
            token = tokens[idx]
            if token.ttype is DML and token.value.upper() == "SELECT":
                idx += 1
                break
            idx += 1

        # Check for DISTINCT
        if idx < len(tokens):
            token = tokens[idx]
            if token.ttype is Keyword and token.value.upper() == "DISTINCT":
                result.distinct = True
                idx += 1

        # Parse column list
        if idx < len(tokens):
            token = tokens[idx]
            if token.ttype is Wildcard:
                # SELECT *
                result.columns.append(SelectColumn(name="*"))
                idx += 1
            elif isinstance(token, IdentifierList):
                # Multiple columns
                for identifier in token.get_identifiers():
                    col = self._parse_identifier(identifier)
                    result.columns.append(col)
                idx += 1
            elif isinstance(token, Identifier):
                # Single column
                col = self._parse_identifier(token)
                result.columns.append(col)
                idx += 1
            elif isinstance(token, Function):
                # Single function
                col = self._parse_function(token)
                result.columns.append(col)
                idx += 1

        return idx

    def _parse_identifier(self, identifier) -> SelectColumn:
        """Parse an identifier into a SelectColumn."""
        # Check if it's a function
        for token in identifier.tokens:
            if isinstance(token, Function):
                return self._parse_function(token, identifier.get_alias())

        name = identifier.get_real_name() or str(identifier)
        alias = identifier.get_alias()

        return SelectColumn(name=name, alias=alias)

    def _parse_function(self, func, alias: Optional[str] = None) -> SelectColumn:
        """Parse a function (aggregate) into a SelectColumn."""
        func_name = func.get_real_name().upper()

        # Get the column inside the function
        inner_col = "*"
        distinct = False

        for token in func.tokens:
            if isinstance(token, Parenthesis):
                # Get content inside parentheses
                inner_tokens = [t for t in token.tokens if not t.is_whitespace]
                for inner in inner_tokens:
                    if inner.ttype is Keyword and inner.value.upper() == "DISTINCT":
                        distinct = True
                    elif isinstance(inner, Identifier):
                        inner_col = inner.get_real_name()
                    elif inner.ttype in (Name, Wildcard) or isinstance(inner, Token):
                        if inner.value not in ("(", ")"):
                            inner_col = inner.value

        try:
            aggregate = AggregateFunction(func_name)
        except ValueError:
            # Not an aggregate function, treat as regular column
            return SelectColumn(name=str(func), alias=alias)

        return SelectColumn(
            name=inner_col,
            alias=alias,
            aggregate=aggregate,
            distinct=distinct
        )

    def _parse_from_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the FROM clause and return the next token index."""
        # Find FROM keyword
        while idx < len(tokens):
            token = tokens[idx]
            if token.ttype is Keyword and token.value.upper() == "FROM":
                idx += 1
                break
            idx += 1

        # Parse table name
        if idx < len(tokens):
            token = tokens[idx]
            if isinstance(token, Identifier):
                result.table = token.get_real_name()
                result.table_alias = token.get_alias()
            else:
                result.table = token.value
            idx += 1

        return idx

    def _parse_where_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the WHERE clause and return the next token index."""
        while idx < len(tokens):
            token = tokens[idx]
            if isinstance(token, Where):
                conditions = self._parse_conditions(token)
                result.where_conditions = conditions
                idx += 1
                break
            elif token.ttype is Keyword and token.value.upper() in ("GROUP", "ORDER", "LIMIT", "HAVING"):
                break
            idx += 1

        return idx

    def _parse_conditions(self, where_clause) -> List[WhereCondition]:
        """Parse conditions from a WHERE clause."""
        conditions = []

        for token in where_clause.tokens:
            if isinstance(token, Comparison):
                cond = self._parse_comparison(token)
                conditions.append(cond)

        return conditions

    def _parse_comparison(self, comparison) -> WhereCondition:
        """Parse a comparison expression."""
        tokens = [t for t in comparison.tokens if not t.is_whitespace]

        column = None
        operator = None
        value = None

        for i, token in enumerate(tokens):
            if isinstance(token, Identifier) or token.ttype is Name:
                if column is None:
                    column = token.get_real_name() if isinstance(token, Identifier) else token.value
                else:
                    value = token.get_real_name() if isinstance(token, Identifier) else token.value
            elif token.ttype is sqlparse.tokens.Comparison:
                operator = ComparisonOperator(token.value)
            elif token.ttype in (String.Single, String.Double):
                value = token.value.strip("'\"")
            elif token.ttype in (Number.Integer, Number.Float):
                value = float(token.value) if "." in token.value else int(token.value)

        return WhereCondition(column=column, operator=operator, value=value)

    def _parse_group_by_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the GROUP BY clause and return the next token index."""
        while idx < len(tokens):
            token = tokens[idx]
            if token.ttype is Keyword and token.value.upper() == "GROUP":
                idx += 1
                # Skip BY
                if idx < len(tokens) and tokens[idx].ttype is Keyword:
                    idx += 1

                # Parse columns
                if idx < len(tokens):
                    token = tokens[idx]
                    if isinstance(token, IdentifierList):
                        for identifier in token.get_identifiers():
                            result.group_by.append(identifier.get_real_name() or str(identifier))
                    elif isinstance(token, Identifier):
                        result.group_by.append(token.get_real_name())
                    else:
                        result.group_by.append(token.value)
                    idx += 1
                break
            elif token.ttype is Keyword and token.value.upper() in ("ORDER", "LIMIT", "HAVING"):
                break
            idx += 1

        return idx

    def _parse_having_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the HAVING clause and return the next token index."""
        # Similar to WHERE parsing - simplified for now
        return idx

    def _parse_order_by_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the ORDER BY clause and return the next token index."""
        while idx < len(tokens):
            token = tokens[idx]
            if token.ttype is Keyword and token.value.upper() == "ORDER":
                idx += 1
                # Skip BY
                if idx < len(tokens) and tokens[idx].ttype is Keyword:
                    idx += 1

                # Parse columns
                if idx < len(tokens):
                    token = tokens[idx]
                    if isinstance(token, IdentifierList):
                        for identifier in token.get_identifiers():
                            col_name = identifier.get_real_name() or str(identifier)
                            ascending = True
                            for t in identifier.tokens:
                                if t.ttype is Keyword and t.value.upper() == "DESC":
                                    ascending = False
                            result.order_by.append(OrderByColumn(column=col_name, ascending=ascending))
                    elif isinstance(token, Identifier):
                        ascending = True
                        for t in token.tokens:
                            if t.ttype is Keyword and t.value.upper() == "DESC":
                                ascending = False
                        result.order_by.append(OrderByColumn(
                            column=token.get_real_name(),
                            ascending=ascending
                        ))
                    idx += 1
                break
            elif token.ttype is Keyword and token.value.upper() == "LIMIT":
                break
            idx += 1

        return idx

    def _parse_limit_clause(self, tokens: List, idx: int, result: ParsedQuery) -> int:
        """Parse the LIMIT clause and return the next token index."""
        while idx < len(tokens):
            token = tokens[idx]
            if token.ttype is Keyword and token.value.upper() == "LIMIT":
                idx += 1
                if idx < len(tokens):
                    try:
                        result.limit = int(tokens[idx].value)
                    except ValueError:
                        pass
                    idx += 1
                break
            elif token.ttype is Keyword and token.value.upper() == "OFFSET":
                idx += 1
                if idx < len(tokens):
                    try:
                        result.offset = int(tokens[idx].value)
                    except ValueError:
                        pass
                    idx += 1
            idx += 1

        return idx


class SQLParseError(Exception):
    """Exception raised when SQL parsing fails."""
    pass
