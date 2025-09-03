<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Registro Não Aprovado</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .footer { text-align: center; color: #666; font-size: 12px; padding: 20px; }
        .contact-info { background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>❌ Registro Não Aprovado</h1>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{ $user->name }}</strong>,</p>
            
            <p>Agradecemos o seu interesse em se tornar um parceiro Cotarco.</p>
            
            <p>Após uma análise cuidadosa da sua solicitação, informamos que <strong>não foi possível aprovar</strong> seu registro como parceiro neste momento.</p>
            
            <p>Esta decisão pode ter sido baseada em diversos fatores, incluindo:</p>
            <ul>
                <li>Documentação incompleta ou inadequada</li>
                <li>Requisitos mínimos não atendidos</li>
                <li>Outras questões específicas do processo de aprovação</li>
            </ul>
            
            <div class="contact-info">
                <p><strong>📞 Precisa de esclarecimentos?</strong></p>
                <p>Se você acredita que houve algum equívoco ou gostaria de entender melhor os motivos da não aprovação, entre em contato conosco:</p>
                <p><strong>Email:</strong> suporte@cotarco.com<br>
                <strong>Telefone:</strong> (11) 9999-9999</p>
            </div>
            
            <p>Agradecemos mais uma vez o seu interesse e esperamos poder colaborar em futuras oportunidades.</p>
            
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
