# ============================================
# SCRIPT: Converter Certificado .p12 para Base64
# ============================================
#
# Este script converte o certificado EFI (.p12) para Base64
# para ser usado nas variáveis de ambiente do Netlify
#
# USO:
# 1. Abra PowerShell
# 2. Navegue até a pasta do projeto
# 3. Execute: .\converter-certificado.ps1
#
# ============================================

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  CONVERSOR DE CERTIFICADO EFI PARA BASE64" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Caminho do certificado
$certPath = ".\backend\certs\producao-846985-pods.p12"

# Verificar se o arquivo existe
if (-Not (Test-Path $certPath)) {
    Write-Host "❌ ERRO: Certificado não encontrado!" -ForegroundColor Red
    Write-Host "   Procurado em: $certPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Certifique-se de que o certificado está na pasta:" -ForegroundColor Yellow
    Write-Host "   backend/certs/producao-846985-pods.p12" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Certificado encontrado!" -ForegroundColor Green
Write-Host "   Arquivo: $certPath" -ForegroundColor Gray
Write-Host ""

# Converter para Base64
Write-Host "🔄 Convertendo para Base64..." -ForegroundColor Yellow

try {
    $base64 = [Convert]::ToBase64String([IO.File]::ReadAllBytes($certPath))
    
    Write-Host "✅ Conversão concluída!" -ForegroundColor Green
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host "  RESULTADO (copie o texto abaixo):" -ForegroundColor Cyan
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host $base64 -ForegroundColor White
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 PRÓXIMOS PASSOS:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Copie o texto Base64 acima (selecione e Ctrl+C)" -ForegroundColor White
    Write-Host "2. Abra o arquivo: .env.netlify" -ForegroundColor White
    Write-Host "3. Cole no campo: EFI_CERTIFICATE_BASE64=" -ForegroundColor White
    Write-Host "4. Salve o arquivo" -ForegroundColor White
    Write-Host "5. No painel do Netlify, adicione como variável de ambiente" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Este Base64 é SENSÍVEL!" -ForegroundColor Red
    Write-Host "   - NÃO compartilhe publicamente" -ForegroundColor Red
    Write-Host "   - NÃO commite no Git" -ForegroundColor Red
    Write-Host "   - Use apenas no painel do Netlify" -ForegroundColor Red
    Write-Host ""
    
    # Salvar em arquivo temporário (opcional)
    $outputFile = "certificado-base64.txt"
    $base64 | Out-File -FilePath $outputFile -Encoding UTF8
    Write-Host "💾 Base64 também salvo em: $outputFile" -ForegroundColor Green
    Write-Host "   (Você pode deletar este arquivo depois de copiar)" -ForegroundColor Gray
    Write-Host ""
    
} catch {
    Write-Host "❌ ERRO ao converter certificado:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "✅ Processo concluído!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
