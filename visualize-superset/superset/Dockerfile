FROM apache/superset:4.0.0

USER root

# Install additional system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy custom requirements
COPY requirements.txt /app/requirements-custom.txt
RUN pip install --no-cache-dir -r /app/requirements-custom.txt

# Copy Superset configuration
COPY superset_config.py /app/pythonpath/superset_config.py

# Ensure proper ownership
RUN chown -R superset:superset /app

USER superset

# Set environment variables
ENV SUPERSET_CONFIG_PATH=/app/pythonpath/superset_config.py
ENV FLASK_APP=superset

EXPOSE 8088

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:8088/health || exit 1

CMD ["gunicorn", "--bind", "0.0.0.0:8088", "--workers", "4", "--timeout", "120", "superset.app:create_app()"]
