# 🚀 Portfólio DevSecOps — Do Código Local à Nuvem AWS

> **Memorial Descritivo e Técnico** de uma jornada de engenharia do mundo real: de um projeto estático no PC a uma infraestrutura resiliente, segura e automatizada na nuvem AWS.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Stack Tecnológica](#-stack-tecnológica)
- [Arquitetura](#-arquitetura)
- [Camada 1 — Aplicação: Container Ultra-Light](#%EF%B8%8F-camada-1--aplicação-o-container-ultra-light)
- [Camada 2 — Infraestrutura: IaC com OpenTofu](#-camada-2--infraestrutura-iac-com-opentofu)
- [Camada 3 — Identidade: IAM e Zero Trust](#-camada-3--identidade-iam-e-segurança-zero-trust)
- [Camada 4 — Automação: Bootstrap via User Data](#-camada-4--automação-bootstrap-via-user-data)
- [Diário de Troubleshooting](#%EF%B8%8F-diário-de-troubleshooting)
- [Como Reproduzir](#-como-reproduzir)
- [Status do Projeto](#-status-do-projeto)

---

## 🌐 Visão Geral

Este projeto documenta a construção completa de um portfólio profissional hospedado na AWS, com foco em práticas de **DevSecOps**. O diferencial não é apenas o site em si, mas toda a cadeia de engenharia que o sustenta: segurança em camadas, infraestrutura como código, containerização otimizada e deploy automatizado.

```
Desenvolvedor → GitHub → Docker Image → ECR → EC2 → Usuário Final
                                  ↑
                           OpenTofu (IaC)
                           IAM Role (Zero Trust)
```

---

## 🧰 Stack Tecnológica

| Camada | Tecnologia | Finalidade |
|---|---|---|
| **Frontend** | [Astro](https://astro.build/) | Framework de portfólio estático |
| **Containerização** | Docker + Alpine Linux | Imagem mínima e segura |
| **Registro de Imagens** | Amazon ECR | Armazenamento privado com scan de CVEs |
| **Infraestrutura** | [OpenTofu](https://opentofu.org/) (IaC) | Provisionamento declarativo da AWS |
| **Compute** | AWS EC2 t3.micro | Hospedagem dentro do Free Tier |
| **Identidade** | AWS IAM Roles + Instance Profile | Autenticação sem chaves estáticas |
| **Rede** | AWS Security Groups | Firewall stateful na camada de rede |
| **Automação** | Bash + AWS CLI (User Data) | Bootstrap automático no primeiro boot |
| **Região** | us-east-1 (Virgínia do Norte) | Alta disponibilidade e Free Tier |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        AWS Cloud (us-east-1)                │
│                                                             │
│   ┌──────────────────┐          ┌───────────────────────┐  │
│   │   Amazon ECR     │          │     EC2 t3.micro       │  │
│   │                  │  pull    │                       │  │
│   │  📦 portfolio:   │◄─────────│  🐳 Docker Container  │  │
│   │     latest       │          │     (Alpine Linux)    │  │
│   │                  │          │     porta 80:80       │  │
│   │  scan_on_push ✓  │          │                       │  │
│   └──────────────────┘          └───────────┬───────────┘  │
│                                             │               │
│   ┌──────────────────┐          ┌───────────▼───────────┐  │
│   │   IAM Role       │ assume   │   Security Group      │  │
│   │                  │─────────►│                       │  │
│   │  portfolio_ec2_  │          │  ✅ HTTP  :80 (0.0.0.0)│  │
│   │  role            │          │  ✅ SSH   :22          │  │
│   │                  │          │  ❌ Resto bloqueado    │  │
│   │  ECR: ReadOnly   │          └───────────────────────┘  │
│   └──────────────────┘                                      │
│                                                             │
│   ┌──────────────────────────────────────────────────────┐  │
│   │          OpenTofu (IaC) — Estado Versionado          │  │
│   │    ECR · EC2 · IAM Role · Instance Profile · SG      │  │
│   └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Camada 1 — Aplicação: O Container Ultra-Light

### Por que Alpine Linux?

A escolha da imagem base não foi aleatória. O Alpine Linux foi selecionado por três motivos estratégicos:

| Critério | Alpine Linux | Ubuntu/Debian |
|---|---|---|
| Tamanho base | ~5 MB | ~80–120 MB |
| Binários desnecessários | Mínimos | Muitos |
| Superfície de ataque | Pequena | Maior |
| Tempo de push/pull | Segundos | Minutos |

### Dockerfile (Estrutura Multi-Stage)

```dockerfile
# Stage 1: Build da aplicação Astro
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Imagem de produção ultra-leve
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
```

### Amazon ECR — Registro Privado com Auditoria

O ECR foi configurado com a propriedade `scan_on_push = true`, o que significa:

- Cada `docker push` dispara automaticamente uma análise de CVEs (vulnerabilidades conhecidas)
- Alertas são gerados caso a imagem contenha pacotes com falhas de segurança conhecidas
- **Zero imagem vulnerável passa desapercebida**

---

## 📜 Camada 2 — Infraestrutura: IaC com OpenTofu

### Por que IaC e não ClickOps?

O "ClickOps" (configurar manualmente pelo console AWS) é rápido, mas gera problemas sérios:

- ❌ Sem rastreabilidade (quem mudou o quê?)
- ❌ Sem reversibilidade rápida
- ❌ Impossível replicar o ambiente exato
- ❌ Segredos e configurações ficam na cabeça de uma pessoa

Com **OpenTofu**, o estado desejado da nuvem está em arquivos `.tf` versionados no Git.

### Recursos Provisionados

```hcl
# Exemplo de estrutura dos módulos Tofu

# 1. Repositório ECR
resource "aws_ecr_repository" "portfolio" {
  name                 = "portfolio"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true  # Auditoria automática de CVEs
  }
}

# 2. Instância EC2
resource "aws_instance" "portfolio_server" {
  ami           = "ami-xxxxxxxxxxxxxxxxx"  # Amazon Linux 2023
  instance_type = "t3.micro"              # Free Tier eligible

  iam_instance_profile = aws_iam_instance_profile.portfolio_profile.name
  vpc_security_group_ids = [aws_security_group.portfolio_sg.id]

  user_data = file("bootstrap.sh")  # Script de boot automático
}

# 3. Security Group (Firewall)
resource "aws_security_group" "portfolio_sg" {
  name        = "portfolio-sg"
  description = "Allow HTTP and SSH traffic"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
```

### Fluxo de Trabalho IaC

```bash
# 1. Inicializar o backend de estado
tofu init

# 2. Verificar o plano de mudanças (dry-run)
tofu plan

# 3. Aplicar as mudanças na AWS
tofu apply

# 4. Destruir recursos quando necessário
tofu destroy
```

---

## 🔐 Camada 3 — Identidade: IAM e Segurança Zero Trust

### O Problema que Evitamos

A abordagem ingênua seria criar um usuário IAM, gerar chaves de acesso (`ACCESS_KEY_ID` + `SECRET_ACCESS_KEY`) e colocá-las dentro da EC2. Isso é um **antipadrão grave**:

```
⚠️  Risco: Chaves estáticas dentro do servidor
    → Se alguém invadir a máquina, terá acesso total à sua conta AWS
    → Chaves podem vazar via logs, histórico de shell, etc.
```

### A Solução: IAM Role com Principle of Least Privilege

```
EC2 Instance
     │
     │ "Quem sou eu?"
     ▼
Instance Profile ──► IAM Role: portfolio_ec2_role
                              │
                              │ Permissões:
                              ▼
                    AmazonEC2ContainerRegistryReadOnly
                              │
                              │ Pode:
                              ├── ✅ ecr:GetAuthorizationToken
                              ├── ✅ ecr:BatchGetImage
                              ├── ✅ ecr:GetDownloadUrlForLayer
                              │
                              │ Não pode:
                              ├── ❌ ecr:DeleteRepository
                              ├── ❌ ec2:TerminateInstances
                              └── ❌ iam:CreateUser
```

### Por que isso é mais seguro?

| Aspecto | Chave Estática | IAM Role |
|---|---|---|
| Validade do token | Permanente | Rotação automática (temporário) |
| Armazenamento | No servidor (risco) | No metadata service da AWS |
| Escopo de permissão | O que você configurar | Apenas o necessário |
| Auditoria | Difícil rastrear | CloudTrail registra tudo |
| Revogação | Manual | Imediata via console |

---

## 🤖 Camada 4 — Automação: Bootstrap via User Data

O **User Data** é um script Bash executado automaticamente no **primeiro boot** da instância EC2. É a "mágica" que faz o site subir sozinho, sem intervenção humana.

```bash
#!/bin/bash
# bootstrap.sh — Executado automaticamente no primeiro boot

# ─────────────────────────────────────────────
# 1. PROVISIONAMENTO DO HOST
# ─────────────────────────────────────────────
yum update -y
yum install -y docker aws-cli

# Iniciar e habilitar o daemon do Docker
systemctl start docker
systemctl enable docker

# ─────────────────────────────────────────────
# 2. AUTENTICACAO AUTOMATICA NO ECR
# ─────────────────────────────────────────────
# A IAM Role da instancia fornece credenciais temporarias automaticamente
# Nenhuma chave de acesso necessaria!
AWS_REGION="us-east-1"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

aws ecr get-login-password --region ${AWS_REGION} \
  | docker login --username AWS --password-stdin ${ECR_URI}

# ─────────────────────────────────────────────
# 3. DEPLOY DO CONTAINER
# ─────────────────────────────────────────────
IMAGE="${ECR_URI}/portfolio:latest"

docker pull ${IMAGE}

docker run -d \
  --name portfolio \
  --restart unless-stopped \
  -p 80:80 \
  ${IMAGE}

echo "✅ Deploy concluido com sucesso!"
```

### Fluxo Completo do Bootstrap

```
tofu apply
    │
    ▼
EC2 é criada na AWS
    │
    ▼ (primeiro boot)
User Data executa bootstrap.sh
    │
    ├── yum update + install docker
    │
    ├── IAM Role fornece token temporário
    │
    ├── docker login no ECR (sem chaves!)
    │
    ├── docker pull portfolio:latest
    │
    └── docker run -p 80:80
            │
            ▼
    🌐 Site Online!
```

---

## 🛠️ Diário de Troubleshooting

Nenhuma jornada de engenheiro está completa sem a resolução de problemas reais. Estes são os obstáculos encontrados e como foram superados:

---

### 🐛 Bug #1 — O Erro de Caracteres ASCII

**Sintoma:**
```
Error: InvalidParameterValue: Invalid characters in description
```

**Causa Raiz:**
A AWS API não aceita caracteres especiais (acentos, cedilha) em campos como descrição de Security Groups. O texto original continha `"tráfego"` com acento no `a`.

**Solução:**
```hcl
# ❌ Antes (quebrava o deploy)
description = "Permite tráfego HTTP e SSH"

# ✅ Depois (AWS-safe)
description = "Allow HTTP and SSH traffic"
```

**Lição:** Ao escrever IaC para a AWS, use apenas caracteres ASCII puro em todos os campos de metadados (names, descriptions, tags).

---

### 🐛 Bug #2 — Permissões IAM Insuficientes (O Chefe de Fase)

**Sintoma:**
```
Error: AccessDenied: User arn:aws:iam::XXXX:user/github-actions-user
       is not authorized to perform: iam:CreateRole
```

**Causa Raiz:**
O usuário IAM utilizado no terminal (`github-actions-user`) tinha permissões de leitura, mas não possuía autorização para criar Roles, Instance Profiles ou associá-los a instâncias.

**Solução:**
Adicionou-se ao usuário as policies necessárias para o provisionamento via IaC:

```
github-actions-user
  └── Policies adicionadas:
      ├── IAMFullAccess         (criar/gerenciar Roles e Profiles)
      └── AmazonEC2FullAccess   (provisionar instâncias e Security Groups)
```

**Lição:** Ao provisionar infraestrutura com IaC, o usuário que executa o `tofu apply` precisa de permissões para criar **todos** os recursos declarados, incluindo recursos de IAM.

---

### 🐛 Bug #3 — O Mistério do HTTPS/HSTS

**Sintoma:**
O site não carregava no navegador, mesmo com a EC2 online e o container rodando na porta 80.

**Causa Raiz:**
O browser utilizava cache de **HSTS (HTTP Strict Transport Security)** de visitas anteriores ao domínio, forçando automaticamente o redirecionamento para `https://` (porta 443). Nossa infraestrutura estava configurada apenas para `http://` (porta 80).

```
Browser ──► https://meu-site.com (porta 443)
                    │
                    ▼
         Security Group: porta 443 FECHADA ❌
                    │
                    ▼
              Timeout / ERR_CONNECTION_REFUSED
```

**Solução:**
```
1. Acessar via aba anônima (sem cache HSTS)
2. Forçar explicitamente: http://IP-DA-EC2
3. Solução definitiva futura: configurar HTTPS + certificado SSL
```

**Lição:** HSTS é silencioso e pode enganar. Em ambientes de desenvolvimento/teste sem HTTPS, sempre use aba anônima ou acesso direto pelo IP com protocolo explícito.

---

## ⚙️ Como Reproduzir

### Pré-requisitos

```bash
# Ferramentas necessárias
docker --version        # Docker 24+
tofu --version          # OpenTofu 1.6+
aws --version           # AWS CLI v2
```

### Configuração Inicial

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/seu-portfolio.git
cd seu-portfolio

# 2. Configure suas credenciais AWS (apenas para provisionamento inicial)
aws configure
# AWS Access Key ID: ****
# AWS Secret Access Key: ****
# Default region: us-east-1
# Default output format: json
```

### Build e Push da Imagem

```bash
# 3. Build da imagem Docker
docker build -t portfolio:latest .

# 4. Tag para o ECR
docker tag portfolio:latest \
  SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest

# 5. Login no ECR
aws ecr get-login-password --region us-east-1 \
  | docker login --username AWS --password-stdin \
    SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# 6. Push da imagem
docker push SEU_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/portfolio:latest
```

### Provisionamento da Infraestrutura

```bash
# 7. Entre no diretório de IaC
cd infrastructure/

# 8. Inicialize o OpenTofu
tofu init

# 9. Revise o plano (sem executar ainda!)
tofu plan

# 10. Aplique a infraestrutura
tofu apply
# Digite 'yes' para confirmar

# ✅ Aguarde a conclusão. O site estará disponível no IP público da EC2.
```

### Destruir Recursos (Quando Necessário)

```bash
# ⚠️ Atenção: este comando remove TODOS os recursos provisionados
tofu destroy
```

---

## 🏁 Status do Projeto

| Componente | Status |
|---|---|
| 🌐 Site | ✅ Online e funcional |
| 🐳 Container Alpine | ✅ Build otimizado |
| 📦 ECR + CVE Scan | ✅ Ativo |
| 🏗️ IaC com OpenTofu | ✅ Documentado e versionado |
| 🔐 IAM Role (Zero Trust) | ✅ Implementado |
| 🔒 Security Group | ✅ Configurado |
| 🤖 Bootstrap automatizado | ✅ Funcional |
| 🛡️ HTTPS / SSL | 🔜 Próxima etapa |
| 🔄 CI/CD Pipeline | 🔜 Próxima etapa |

---

## 🗺️ Roadmap

- [ ] **HTTPS com ACM + ALB** — Certificado SSL gerenciado pela AWS
- [ ] **GitHub Actions CI/CD** — Build e deploy automático a cada push
- [ ] **CloudFront CDN** — Cache global e melhor performance
- [ ] **Route 53** — Domínio personalizado
- [ ] **CloudWatch Alarms** — Monitoramento e alertas proativos
- [ ] **Terraform Cloud / S3 Backend** — Estado remoto para trabalho em equipe

---

## 📚 Referências e Documentação

- [Documentação OpenTofu](https://opentofu.org/docs/)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Amazon ECR User Guide](https://docs.aws.amazon.com/AmazonECR/latest/userguide/)
- [AWS EC2 User Data](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/user-data.html)
- [Alpine Linux — Por que usar?](https://alpinelinux.org/about/)
- [HSTS — Mozilla MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)

---

## 👤 Autor

Desenvolvido como projeto de práticas em **DevSecOps**, **Cloud Engineering** e **Infrastructure as Code**.
Após a finalização, a instancia foi deletada a fim de evitar cobranças.

> *"A segurança não é uma feature, é uma camada."*

---

<div align="center">

**Feito com 🔧 engenharia, ☁️ AWS e muita resolução de problema**

</div>
