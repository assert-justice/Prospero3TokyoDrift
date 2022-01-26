import LangDef;
import Token;

typedef Label = {name: String, idx : Int};

class Parser{
    var program : Array<String>;
    var current : Int;
    var errors : Array<String>;
    var sync : Bool;
    var tokens : Array<Token>;
    var labels : Array<Label>;
    public function new() {
        //
    }
    function error(message : String) {
        // supress errors when already desynched
        if (!sync) return;
        var token = peek();
        var error = 'Error: $message on line ${token.line} at "${token.literal}"';
        errors.push(error);
        trace(error);
    }
    function getLabel() {
        var label = {name: 'internal_${labels.length}', idx: 0};
        labels.push(label);
        return label.name;
    }
    function peek() {
        return tokens[current];
    }
    function advance() {
        current++;
        return tokens[current - 1];
    }
    function consume(type : String, message : String) : Token {
        var token = advance();
        if (token.type != type) error(message);
        return token;
    }
    function matches(types : Array<String>) {
        for (type in types) {
            if (match(type)) return true;
        }
        return false;
    }
    function match(type : String) {
        if (peek().type == type){
            advance();
            return true;
        }
        return false;
    }
    function statement() {
        // synchronize errors on statement boundaries
        sync = true;
        var token = peek();
        if (match("if")){return if_();}
        else if (match("while")){}
        else if (match("for")){}
        else if (match("let")){return let();}
        else if (match("func")){}
        else if (match("print")){
            var expr = expression();
            expr.push("print");
            return expr;
        }
        //else if (matches(LangDef.block)){return block(token.type);}
        else {advance();} // stops infinite loops hopefully. TODO: try assignment
        return [];
    }
    function if_() {
        var out = [];
        var end_label = getLabel();
        while (peek().type != "eof"){
            var next_label = getLabel();
            out = out.concat(expression());
            out.push('fjmp $next_label');
            consume("then", "expected then keyword after if");
            out = out.concat(ifBlock());
            out.push('jmp $end_label');
            out.push('label $next_label');
            if (match("elif")) continue;
            else if (match("else")){
                out = out.concat(ifBlock());
            }
            else{break;}
        }
        out.push('label $end_label');
        return out;
    }
    function let() {
        var name = consume("identifier", "expected identifier after let keyword").literal;
        var code = ['init_var $name'];
        if (match("=")){
            code = code.concat(expression());
            code.push('save_var $name');
        }
        return code;
    }
    function assignment() : Array<String>{
        return [];
    }
    function block() : Array<String>{
        var out = ["block"];
        while (peek().type != "eof"){
            out = out.concat(statement());
            if (peek().type == "end") break;
        }
        out.push("end");
        return out;
    }
    function ifBlock() {
        var out = ["block"];
        while (peek().type != "eof"){
            out = out.concat(statement());
            if (["end", "elif", "else"].contains(peek().type)) break;
        }
        out.push("end");
        return out;
    }
    function expression() : Array<String> {
        return equal();
    }
    function logical() {
        // not so fast, need control flow
        // var expr = equal();
        // var token = peek();
        // if (matches(["and", "or"])){
        //     expr = expr.concat(equal());
        //     expr.push(token.type);
        // }
        // return expr;
    }
    function equal() {
        var expr = compare();
        var token = peek();
        if (matches(["==", "!="])){
            expr = expr.concat(compare());
            expr.push(token.type);
        }
        return expr;
    }
    function compare() {
        var expr = add();
        var token = peek();
        if (matches(["<", ">", "<=", ">="])){
            expr = expr.concat(add());
            expr.push(token.type);
        }
        return expr;
    }
    function add() {
        var expr = multiply();
        var token = peek();
        if (matches(["-", "+"])){
            expr = expr.concat(multiply());
            expr.push(token.type);
        }
        return expr;
    }
    function multiply() {
        var expr = exp();
        var token = peek();
        if (matches(["*", "/", "%"])){
            expr = expr.concat(exp());
            expr.push(token.type);
        }
        return expr;
    }
    function exp() {
        var expr = unary();
        if (match("**")){
            var expr2 = unary();
            expr = expr.concat(expr2);
            expr.push("exp");
        }
        return expr;
    }
    function unary() {
        var token = peek();
        if (!LangDef.unary.contains(token.type)) return primary();
        advance();
        var expr = primary();
        if (token.type == "-"){expr.push("neg");}
        else {expr.push("not");}
        return expr;
    }
    function primary() : Array<String> {
        var token = peek();
        if (match("(")){var expr = expression(); consume(")", "expected closing parenthesis"); return expr;}
        // else if (match("[")){}
        // else if (match("{")){}
        else if (match("string")){return ['string "${token.literal}"'];}
        else if (match("number")){return ['number ${token.value}'];}
        else if (matches(["true", "false"])){return [token.type];}
        // TODO: function calling syntax
        else if (match("identifier")){return ['load_var ${token.literal}'];}
        else {error("unexpected token");}
        return [];
    }
    public function parse(tokens : Array<Token>) {
        this.tokens = tokens;
        program = [];
        current = 0;
        labels = [];
        errors = [];
        sync = true;
        var test = block();
        consume("eof", "expected end of file");
        trace(test);
        return test;
    }
}