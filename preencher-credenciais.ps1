# ============================================
# SCRIPT: Preencher Credenciais Automaticamente
# ============================================
#
# Este script preenche automaticamente o arquivo .env.netlify
# com todas as suas credenciais
#
# USO:
# 1. Abra PowerShell como Administrador
# 2. Execute: Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
# 3. Execute: .\preencher-credenciais.ps1
#
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PREENCHENDO CREDENCIAIS AUTOMATICAMENTE" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Caminho do arquivo
$envFile = ".\.env.netlify"

# Verificar se o arquivo existe
if (-Not (Test-Path $envFile)) {
    Write-Host "❌ ERRO: Arquivo .env.netlify não encontrado!" -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "✅ Arquivo encontrado: $envFile" -ForegroundColor Green
Write-Host ""

# Ler o conteúdo atual
$content = Get-Content $envFile -Raw

Write-Host "🔄 Substituindo credenciais..." -ForegroundColor Yellow
Write-Host ""

# Substituir VITE_SUPABASE_URL
$content = $content -replace 'VITE_SUPABASE_URL=.*', 'VITE_SUPABASE_URL=https://fkstktohbnwsnzbarujc.supabase.co'
Write-Host "✅ VITE_SUPABASE_URL preenchido" -ForegroundColor Green

# Substituir VITE_SUPABASE_ANON_KEY
$content = $content -replace 'VITE_SUPABASE_ANON_KEY=.*', 'VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZrc3RrdG9oYm53c256YmFydWpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA2NTM0MjUsImV4cCI6MjA0NjIyOTQyNX0.Gg-Ql4uyLDdmQkQnLGONXjxKKNRQaOtNEYBqcfJTiHw'
Write-Host "✅ VITE_SUPABASE_ANON_KEY preenchido" -ForegroundColor Green

# Substituir EFI_CLIENT_ID
$content = $content -replace 'EFI_CLIENT_ID=.*', 'EFI_CLIENT_ID=Client_Id_0e0ccdf56b9bbed3b664a3cb4298b869cc81a72e'
Write-Host "✅ EFI_CLIENT_ID preenchido" -ForegroundColor Green

# Substituir EFI_CLIENT_SECRET
$content = $content -replace 'EFI_CLIENT_SECRET=.*', 'EFI_CLIENT_SECRET=Client_Secret_81fb34227302dbea981f0441f1f4bbed3fbada11'
Write-Host "✅ EFI_CLIENT_SECRET preenchido" -ForegroundColor Green

# Substituir EFI_PIX_KEY
$content = $content -replace 'EFI_PIX_KEY=.*', 'EFI_PIX_KEY=4243987e-88f2-49ea-a148-3d29506d1635'
Write-Host "✅ EFI_PIX_KEY preenchido" -ForegroundColor Green

# Substituir EFI_SANDBOX
$content = $content -replace 'EFI_SANDBOX=.*', 'EFI_SANDBOX=false'
Write-Host "✅ EFI_SANDBOX preenchido (false = PRODUÇÃO)" -ForegroundColor Green

# Converter certificado para Base64
$certPath = ".\backend\certs\producao-846985-pods.p12"
if (Test-Path $certPath) {
    $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($certPath))
    $content = $content -replace 'EFI_CERTIFICATE_BASE64=.*', "EFI_CERTIFICATE_BASE64=$base64"
    Write-Host "✅ EFI_CERTIFICATE_BASE64 preenchido (certificado convertido)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Certificado não encontrado em: $certPath" -ForegroundColor Yellow
    Write-Host "   EFI_CERTIFICATE_BASE64 não foi preenchido" -ForegroundColor Yellow
}

Write-Host ""

# Salvar o arquivo
$content | Set-Content $envFile -NoNewline

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ CREDENCIAIS PREENCHIDAS COM SUCESSO!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verifique o arquivo .env.netlify" -ForegroundColor White
Write-Host "2. Acesse o painel do Netlify: https://app.netlify.com" -ForegroundColor White
Write-Host "3. Vá em: Site settings → Environment variables" -ForegroundColor White
Write-Host "4. Adicione CADA variável do arquivo .env.netlify" -ForegroundColor White
Write-Host "5. Faça o deploy: git push origin main" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  IMPORTANTE:" -ForegroundColor Red
Write-Host "   - EFI_SANDBOX=false (PRODUÇÃO - cobranças REAIS!)" -ForegroundColor Red
Write-Host "   - Se quiser testar, mude para EFI_SANDBOX=true" -ForegroundColor Red
Write-Host "   - NUNCA commite o arquivo .env.netlify no Git" -ForegroundColor Red
Write-Host ""

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✨ Processo concluído!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
