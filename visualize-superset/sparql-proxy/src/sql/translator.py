"""
SQL to SPARQL Translator.
Converts parsed SQL queries to SPARQL queries for LINDAS cube data.
"""

import logging
from typing import Dict, List, Optional, Any

from .parser import (
    ParsedQuery,
    SelectColumn,
    WhereCondition,
    OrderByColumn,
    AggregateFunction,
    ComparisonOperator,
)
from ..sparql.namespaces import get_prefix_declarations, PREFIXES

logger = logging.getLogger(__name__)


class SQLToSPARQLTranslator:
    """
    Translates SQL queries to SPARQL queries for LINDAS cube data.

    The translator maps SQL tables to RDF cube URIs and columns to
    cube dimensions/measures.
    """

    def __init__(self, cube_mapping: Optional[Dict[str, str]] = None):
        """
        Initialize the translator.

        Args:
            cube_mapping: Optional mapping of table names to cube URIs
        """
        self.cube_mapping = cube_mapping or {}

    def translate(self, parsed_query: ParsedQuery) -> str:
        """
        Translate a parsed SQL query to SPARQL.

        Args:
            parsed_query: The parsed SQL query

        Returns:
            SPARQL query string
        """
        logger.debug(f"Translating query for table: {parsed_query.table}")

        # Build SPARQL query parts
        prefixes = get_prefix_declarations()
        select_clause = self._build_select_clause(parsed_query)
        where_clause = self._build_where_clause(parsed_query)
        group_by_clause = self._build_group_by_clause(parsed_query)
        order_by_clause = self._build_order_by_clause(parsed_query)
        limit_offset = self._build_limit_offset(parsed_query)

        # Combine into full query
        query = f"""{prefixes}

{select_clause}
WHERE {{
{where_clause}
}}
{group_by_clause}
{order_by_clause}
{limit_offset}
""".strip()

        logger.debug(f"Generated SPARQL: {query}")
        return query

    def _build_select_clause(self, query: ParsedQuery) -> str:
        """Build the SPARQL SELECT clause."""
        distinct = "DISTINCT " if query.distinct else ""

        if len(query.columns) == 1 and query.columns[0].name == "*":
            # SELECT * - need to return all available variables
            return f"SELECT {distinct}*"

        variables = []
        for col in query.columns:
            var_name = self._column_to_variable(col)
            if col.aggregate:
                agg_func = col.aggregate.value
                inner_var = f"?{self._sanitize_var_name(col.name)}"
                if col.distinct:
                    var_name = f"({agg_func}(DISTINCT {inner_var}) AS ?{col.alias or col.name}_{agg_func.lower()})"
                else:
                    var_name = f"({agg_func}({inner_var}) AS ?{col.alias or col.name}_{agg_func.lower()})"
            variables.append(var_name)

        return f"SELECT {distinct}{' '.join(variables)}"

    def _build_where_clause(self, query: ParsedQuery) -> str:
        """Build the SPARQL WHERE clause body."""
        lines = []

        # Get cube URI
        cube_uri = self._get_cube_uri(query.table)

        # Add observation pattern
        lines.append(f"  ?observation a cube:Observation ;")
        lines.append(f"    cube:observedBy <{cube_uri}> .")

        # Add patterns for selected columns
        for col in query.columns:
            if col.name != "*":
                col_pattern = self._column_to_pattern(col.name)
                lines.append(col_pattern)

        # Add filter conditions from WHERE clause
        for condition in query.where_conditions:
            filter_expr = self._condition_to_filter(condition)
            if filter_expr:
                lines.append(filter_expr)

        return "\n".join(lines)

    def _build_group_by_clause(self, query: ParsedQuery) -> str:
        """Build the SPARQL GROUP BY clause."""
        if not query.group_by:
            # Check if we need GROUP BY for aggregates
            has_aggregates = any(col.aggregate for col in query.columns)
            non_aggregate_cols = [col for col in query.columns if not col.aggregate and col.name != "*"]

            if has_aggregates and non_aggregate_cols:
                group_vars = [f"?{self._sanitize_var_name(col.name)}" for col in non_aggregate_cols]
                return f"GROUP BY {' '.join(group_vars)}"
            return ""

        group_vars = [f"?{self._sanitize_var_name(col)}" for col in query.group_by]
        return f"GROUP BY {' '.join(group_vars)}"

    def _build_order_by_clause(self, query: ParsedQuery) -> str:
        """Build the SPARQL ORDER BY clause."""
        if not query.order_by:
            return ""

        order_exprs = []
        for order_col in query.order_by:
            var_name = f"?{self._sanitize_var_name(order_col.column)}"
            if order_col.ascending:
                order_exprs.append(var_name)
            else:
                order_exprs.append(f"DESC({var_name})")

        return f"ORDER BY {' '.join(order_exprs)}"

    def _build_limit_offset(self, query: ParsedQuery) -> str:
        """Build the SPARQL LIMIT and OFFSET clauses."""
        parts = []
        if query.limit is not None:
            parts.append(f"LIMIT {query.limit}")
        if query.offset is not None:
            parts.append(f"OFFSET {query.offset}")
        return " ".join(parts)

    def _get_cube_uri(self, table_name: Optional[str]) -> str:
        """Get the cube URI for a table name."""
        if not table_name:
            raise TranslationError("No table specified in query")

        # Check if we have a mapping
        if table_name in self.cube_mapping:
            return self.cube_mapping[table_name]

        # Check if table name is already a URI
        if table_name.startswith("http://") or table_name.startswith("https://"):
            return table_name

        # Try to construct a LINDAS cube URI
        # Convention: table name is the cube identifier
        return f"https://environment.ld.admin.ch/foen/cube/{table_name}"

    def _column_to_variable(self, col: SelectColumn) -> str:
        """Convert a column to a SPARQL variable."""
        name = col.alias or col.name
        return f"?{self._sanitize_var_name(name)}"

    def _column_to_pattern(self, col_name: str) -> str:
        """Generate a SPARQL pattern for a column."""
        var_name = self._sanitize_var_name(col_name)

        # Check if column name looks like a predicate URI
        if col_name.startswith("http://") or col_name.startswith("https://"):
            return f"  ?observation <{col_name}> ?{var_name} ."

        # Check for prefixed URIs
        if ":" in col_name and not col_name.startswith("?"):
            prefix, local = col_name.split(":", 1)
            if prefix in PREFIXES:
                return f"  ?observation {col_name} ?{var_name} ."

        # Assume it's a dimension/measure property
        # Use schema.org naming convention
        return f"  ?observation schema:{col_name} ?{var_name} ."

    def _condition_to_filter(self, condition: WhereCondition) -> str:
        """Convert a WHERE condition to a SPARQL FILTER."""
        var_name = f"?{self._sanitize_var_name(condition.column)}"

        if condition.operator == ComparisonOperator.EQ:
            value = self._format_value(condition.value)
            return f"  FILTER({var_name} = {value})"
        elif condition.operator == ComparisonOperator.NE:
            value = self._format_value(condition.value)
            return f"  FILTER({var_name} != {value})"
        elif condition.operator == ComparisonOperator.LT:
            return f"  FILTER({var_name} < {condition.value})"
        elif condition.operator == ComparisonOperator.LE:
            return f"  FILTER({var_name} <= {condition.value})"
        elif condition.operator == ComparisonOperator.GT:
            return f"  FILTER({var_name} > {condition.value})"
        elif condition.operator == ComparisonOperator.GE:
            return f"  FILTER({var_name} >= {condition.value})"
        elif condition.operator == ComparisonOperator.LIKE:
            # Convert SQL LIKE to SPARQL regex
            pattern = condition.value.replace("%", ".*").replace("_", ".")
            return f'  FILTER(REGEX({var_name}, "{pattern}", "i"))'
        elif condition.operator == ComparisonOperator.IS_NULL:
            return f"  FILTER(!BOUND({var_name}))"
        elif condition.operator == ComparisonOperator.IS_NOT_NULL:
            return f"  FILTER(BOUND({var_name}))"

        return ""

    def _format_value(self, value: Any) -> str:
        """Format a value for SPARQL."""
        if isinstance(value, str):
            # Check if it's a URI
            if value.startswith("http://") or value.startswith("https://"):
                return f"<{value}>"
            return f'"{value}"'
        elif isinstance(value, bool):
            return "true" if value else "false"
        elif isinstance(value, (int, float)):
            return str(value)
        return f'"{value}"'

    def _sanitize_var_name(self, name: str) -> str:
        """Sanitize a name for use as a SPARQL variable."""
        # Remove invalid characters
        sanitized = name.replace(".", "_").replace("-", "_").replace(":", "_")
        sanitized = sanitized.replace("/", "_").replace("#", "_")
        # Ensure it starts with a letter
        if sanitized and sanitized[0].isdigit():
            sanitized = f"v{sanitized}"
        return sanitized


class TranslationError(Exception):
    """Exception raised when SQL to SPARQL translation fails."""
    pass


def translate_sql_to_sparql(
    sql: str,
    cube_mapping: Optional[Dict[str, str]] = None
) -> str:
    """
    Convenience function to translate SQL to SPARQL.

    Args:
        sql: The SQL query string
        cube_mapping: Optional mapping of table names to cube URIs

    Returns:
        SPARQL query string
    """
    from .parser import SQLParser

    parser = SQLParser()
    parsed = parser.parse(sql)

    translator = SQLToSPARQLTranslator(cube_mapping)
    return translator.translate(parsed)
