#!/bin/bash
# 1. Qualidade
echo "🔍 Rodando Lint..."
npm run lint || exit 1

# 2. Build do Artefato
echo "🏗️  Buildando Astro..."
npm run build || exit 1

# 3. Build da Imagem
echo "🐳 Criando Imagem Docker..."
docker build -t devopsportfolio-night:$(date +%Y%m%d%H%M) -t devopsportfolio-night:latest .

# 4. Segurança (Opcional, se o trivy estiver instalado)
# trivy image devopsportfolio-night:latest

# 5. Deploy Local para Teste
echo "🚀 Reiniciando container de teste..."
docker rm -f portfolio-astro
docker run -d -p 8080:80 --name portfolio-astro devopsportfolio-night:latest

echo "✅ Sucesso! Acesse http://localhost:8080"