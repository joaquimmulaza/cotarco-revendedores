import fs from 'fs';

const text = fs.readFileSync('debug_out.html', 'utf16le');
if (text.includes('name="email"')) {
    console.log("SUCESSO: input name=email ENCONTRADO!");
} else {
    console.log("FALHA: input name=email NAO encontrado.");
    const match = text.match(/<div id="root">([^]+)/);
    if(match) console.log(match[1].substring(0, 500));
}
