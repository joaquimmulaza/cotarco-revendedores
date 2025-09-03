<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Conta Aprovada</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Conta Aprovada!</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{ $user->name }}</strong>,</p>
            
            <p>Temos o prazer de informar que sua conta de parceiro foi <strong>aprovada</strong> pela nossa equipe!</p>
            
            <p>Agora você já pode fazer login em nossa plataforma e começar a acessar todos os recursos disponíveis para parceiros.</p>
            
            <p style="text-align: center;">
                <a href="{{ $loginUrl }}" class="button">Fazer Login Agora</a>
            </p>
            
            <p><strong>Seus dados de acesso:</strong></p>
            <ul>
                <li><strong>Email:</strong> {{ $user->email }}</li>
                <li><strong>Senha:</strong> A senha que você definiu durante o registro</li>
            </ul>
            
            <p>Bem-vindo à família Cotarco! Estamos ansiosos para trabalhar juntos.</p>
            
            <p>Se tiver alguma dúvida, não hesite em entrar em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe Cotarco</strong></p>
        </div>
        
        <div class="footer">
            <p>Este é um email automático, por favor não responda.</p>
            <p>&copy; {{ date('Y') }} Cotarco. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
