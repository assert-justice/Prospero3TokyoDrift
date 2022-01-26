import LangDef;
import Token;

class Scanner{
    var text = "";
    var current = 0;
    var start = 0;
    var line = 1;
    var tokens : Array<Token> = [];
    var errors : Array<String> = [];
    var synch = true;
    public function new() {
        //
    }
    function advance() {
        current++;
        return text.charAt(current - 1);
    }
    function peek() {
        return text.charAt(current);
    }
    static function isAlpha(c : String) {
        var code = c.charCodeAt(0);
        if (code > 64 && code < 91)return true;
        if (code > 96 && code < 123)return true;
        return false;
    }
    static function isNumeric(c : String) {
        var code = c.charCodeAt(0);
        return code > 47 && code < 58;
    }
    static function isAlphanumeric(c : String) {
        return isAlpha(c) || isNumeric(c);
    }
    function addToken(type : String = null, literal : String = null, value : Float = null) : Token {
        if (literal == null){
            literal = text.substring(start, current);
        }
        if (type == null){
            type = literal;
        }
        if (value == null){
            value = 0.0;
        }
        var token = {type : type, literal : literal, value : value, line : line};
        tokens.push(token);
        return token;
    }
    function whitespace() {
        while (current < text.length){
            var c = text.charAt(current);
            if ([" ", "\t", "\r"].contains(c)){advance();}
            else if (c == "\n"){line++; advance();}
            else{break;}
        }
        return current != start;
    }
    function lex() {
        // look for longest match
        var leng = 0;
        var literal = "";
        for (l in LangDef.lexemes) {
            if (leng >= l.length) continue;
            var match = true;
            for (i in 0...l.length) {
                if (i + current >= text.length) break;
                var c = text.charAt(i + current);
                if (l.charAt(i) != c){
                    match = false;
                    break;
                }
            }
            if (!match) continue;
            leng = l.length;
            literal = l;
        }
        if (literal.length > 0){
            current += literal.length;
            addToken();
            return true;
        }
        return false;
    }
    function number() {
        if (!isNumeric(peek())) return false;
        advance();
        var has_dot = false;
        while (current < text.length){
            var c = peek();
            if (isNumeric(c)){advance();}
            else if (c == "."){
                if (has_dot){
                    error("only one '.' is allowed per number literal");
                }
                else{
                    has_dot = true;
                }
                advance();
            }
            else{break;}
        }
        var lit = text.substring(start, current);
        var val = Std.parseFloat(lit);
        addToken("number", lit, val);
        return true;
    }
    function string() {
        var delim = peek();
        if (!["'", '"'].contains(delim)) return false;
        advance();
        while (current < text.length){
            var c = peek();
            if (c == delim) {advance(); break;}
            else if (c == "\n"){
                line += 1;
            }
            advance();
        }
        if (current > text.length){
            error("unexpected EOF");
        }
        else{
            var lit = text.substring(start + 1, current - 1);
            addToken("string", lit);
        }
        return true;
    }
    function identifier() {
        if (!isAlpha(peek())) return false;
        while(current < text.length && isAlphanumeric(peek())) advance();
        var token = addToken();
        if (!LangDef.keywords.contains(token.literal)){
            token.type = "identifier";
        }
        return true;
    }
    function comment() {
        if (!(peek() == "#")) return false;
        while(current < text.length){
            if(peek() == "\n") break;
            advance();
        }
        return true;
    }
    function error(message : String) {
        if (!synch) return;
        synch = false;
        var err = 'Error: $message on line $line';
        trace(err);
        errors.push(err);
    }
    public function scan(text : String) {
        this.text = text;
        current = 0;
        start = 0;
        line = 1;
        tokens = [];
        errors = [];
        while (current < this.text.length){
            synch = true;
            start = current;
            if (whitespace()){}
            else if(comment()){}
            else if (string()){}
            else if (number()){}
            else if (lex()){}
            else if (identifier()){}
            else{var c = peek(); error('unexpected character "$c"'); break;}
        }
        addToken("eof", "eof", 0);
        for (to in tokens) {
            trace(to);
        }
        if (errors.length > 0){
            tokens = [];
        }
        return tokens;
    }
}