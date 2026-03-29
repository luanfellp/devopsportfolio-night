🚀 Cloud-Native Portfolio: DevSecOps Flow (Astro + OpenTofu + AWS)

Este repositório contém a infraestrutura e o código do meu portfólio profissional. O projeto foi desenhado sob a filosofia DevSecOps, priorizando a automação de infraestrutura (IaC), a segurança de containers e a eficiência de custos na nuvem (AWS Free Tier).
🎯 Objetivos do Projeto

    Provisionamento Imutável: Utilização de OpenTofu para garantir que a infraestrutura seja replicável e livre de configuração manual ("ClickOps").

    Segurança Proativa: Implementação de varredura de vulnerabilidades em camadas (Local e Cloud).

    Eficiência de Recursos: Uso de imagens Alpine Linux para reduzir o footprint de memória e a superfície de ataque.

🛡️ Deep Dive em Segurança (CyberSecurity Focus)

Como entusiasta de segurança, este projeto não apenas "roda um site", mas implementa camadas de proteção rigorosas:
1. Gestão de Vulnerabilidades (Vulnerability Scanning)

O ciclo de vida da imagem Docker passa por dois checkpoints críticos:

    Shift-Left Security (Local): Antes do push, a imagem é validada localmente (ex: via Trivy) para identificar CVEs críticas em pacotes do sistema ou dependências do Node.js.

    ECR Scan on Push: O repositório na AWS está configurado com scan_on_push = true. Cada nova versão do portfólio é automaticamente escaneada pela base de dados da AWS, gerando relatórios de segurança detalhados.

2. Hardening de Container

    Alpine Linux Base: Em vez de imagens robustas e pesadas, utilizamos o Alpine Linux. Isso reduz o tamanho da imagem de ~1GB para menos de 100MB, eliminando binários desnecessários que poderiam ser explorados por atacantes.

    Least Privilege: O container roda apenas o necessário para o Nginx servir os arquivos estáticos do Astro.

3. AWS Identity & Access Management (IAM)

    Instâncias Sem Chaves: A instância EC2 não armazena AWS_ACCESS_KEY ou AWS_SECRET_KEY. Em vez disso, ela utiliza um IAM Instance Profile.

    Roles Temporárias: A máquina "assume" um cargo (Role) com permissão ReadOnly no ECR apenas quando precisa baixar a imagem, eliminando o risco de vazamento de credenciais permanentes.

🏗️ Arquitetura de Infraestrutura (IaC)

A infraestrutura é provisionada via OpenTofu e consiste em:
Recurso	Descrição
EC2 (t3.micro)	Servidor host rodando Amazon Linux 2023 (Free Tier).
ECR	Registro privado para armazenamento seguro de imagens Docker.
Security Group	Firewall stateful permitindo apenas portas 80 (HTTP) e 22 (SSH gerenciado).
User Data	Script de bootstrap que automatiza a instalação do Docker e o deploy do container no boot.
🛠️ Como Reproduzir
1. Preparação da Infraestrutura
Bash

cd terraform
tofu init
tofu plan
tofu apply

2. Ciclo de Deploy do Container
Bash

# Autenticação
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build com foco em performance
docker build -t devopsportfolio-night .

# Tag e Push (Trigger do Scan de Vulnerabilidades)
docker tag devopsportfolio-night:latest <ECR_URL>:latest
docker push <ECR_URL>:latest

📈 Roadmap de Evolução

    [ ] SSL/TLS: Implementar HTTPS via AWS Certificate Manager e CloudFront.

    [ ] CI/CD Pipeline: Automatizar todo o fluxo via GitHub Actions (Build -> Scan -> Push -> Deploy).

    [ ] Monitoramento: Adicionar logs estruturados do Nginx no CloudWatch para análise de tráfego e tentativas de intrusão.
