<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reenvio - Verificar Endereço de Email - Cotarco</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0 auto;
        }
        .email-container {
            max-width: 600px; 
            margin: 0 auto; 
            padding: 20px; 
        }
        .logo-container {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 200px;
            height: auto;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 10px;
        }
        .content {
            padding: 20px; 
            background-color: #f9f9f9; 
            margin-bottom: 30px;
            color: #333 !important;
        }
        .content p {
            margin-bottom: 15px;
            font-size: 16px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .verify-button {
            display: inline-block;
            background-color: #f22f1d;
            color: #ffffff !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        
        .warning-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        .warning-box p {
            margin: 0;
            color: #856404;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
        .url-container {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            word-break: break-all;
        }
        .url-container p {
            margin: 0;
            font-size: 14px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Logo da Cotarco -->
        <div class="logo-container">
            <img src="{{ $message->embed(public_path('logo-cotarco.png')) }}" alt="Logo Cotarco" class="logo">
        </div>

        <!-- Conteúdo principal -->
        <div class="content">
            <p>Saudações,</p>
            <p>Prezado(a),</p>
            <p>Verificámos que ocorreu um erro durante a tentativa de verificação do seu e-mail no registo recentemente efetuado na nossa rede de parceiros Cotarco.</p>
            
            <p>Lamentamos o transtorno causado e informamos que já pode proceder novamente à verificação do seu e-mail, a fim de concluir o seu cadastro e passar a integrar oficialmente a nossa rede.
            Estamos certos de que a sua colaboração será de grande valor e aguardamos com entusiasmo a oportunidade de trabalharmos em conjunto.</p>
        </div>

        <!-- Botão de verificação -->
        <div class="button-container">
            <a href="{{ $actionUrl }}" class="verify-button">Verificar Endereço de Email</a>
        </div>

       

        <!-- Instruções alternativas -->
        <div class="content">
            <p>Se está com problemas ao clicar no botão "Verificar Endereço de Email", copie e cole o URL abaixo no seu navegador web:</p>
        </div>

        <!-- URL de verificação -->
        <div class="url-container">
            <p>{{ $actionUrl }}</p>
        </div>

        <!-- Rodapé -->
        <div class="footer">
            <p>Atenciosamente,<br><strong>Cotarco Tecnologias, Lda.</strong></p>
            <p>Este é um email automático, por favor não responda.</p>
        </div>
    </div>
</body>
</html>
