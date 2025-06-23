#!/bin/bash

# Instalar dependencias de Python
if [ -f "requirements-vercel.txt" ]; then
    python3 -m pip install --upgrade pip
    python3 -m pip install -r requirements-vercel.txt
fi

# Construir el frontend
cd frontend
npm install
npm run build
