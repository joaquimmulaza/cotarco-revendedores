<x-mail::message>
# A sua Conta foi Reativada!

Bem-vindo de volta, **{{ $user->name }}**!

Temos o prazer de informar que a sua conta de parceiro na plataforma Cotarco foi reativada. Já pode aceder ao seu painel e a todos os recursos disponíveis.

<x-mail::button :url="$loginUrl">
Aceder ao Painel
</x-mail::button>

Se tiver alguma questão, não hesite em contactar-nos.

Obrigado,
<br>
Equipa Cotarco
</x-mail::message>


