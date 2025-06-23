#!/bin/bash

# Asegurarse de que Python 3 y pip estén disponibles
if ! command -v python3 &> /dev/null; then
    echo "Python 3 no está instalado. Instalando..."
    apt-get update && apt-get install -y python3 python3-pip
fi

# Instalar dependencias de Python
if [ -f "requirements-vercel.txt" ]; then
    echo "Instalando dependencias de Python..."
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements-vercel.txt
fi

# Construir el frontend
echo "Construyendo el frontend..."
cd frontend
npm install
npm run build
