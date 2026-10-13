#!/bin/bash
set -e

echo "=== CARGANDO SCHEMA PRINCIPAL DE LA BASE DE DATOS ==="
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/schema/sgv.sql

echo "=== CARGANDO CATÁLOGOS ==="
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seeds/01_catalogos.sql

echo "=== CARGANDO DATOS DE PRUEBA ==="
psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f /docker-entrypoint-initdb.d/seeds/02_datos_prueba.sql

echo "=== BASE DE DATOS INICIALIZADA CON ÉXITO ==="