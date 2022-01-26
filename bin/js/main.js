(function ($global) { "use strict";
var HxOverrides = function() { };
HxOverrides.cca = function(s,index) {
	var x = s.charCodeAt(index);
	if(x != x) {
		return undefined;
	}
	return x;
};
HxOverrides.now = function() {
	return Date.now();
};
var LangDef = function() { };
var Loader = function() { };
Loader.getText = function(name) {
	return "# example program\r\nif 1 then print 'hello'\r\n    else print 'unreachable' end\r\n";
};
var Main = function() { };
Main.main = function() {
	var s = new Scanner();
	var p = new Parser();
	var tokens = s.scan(Loader.getText(""));
	var ops = p.parse(tokens);
	ProDom.onLoad(function() {
		var root = ProDom.getRoot();
		var _g = 0;
		while(_g < ops.length) {
			var op = ops[_g];
			++_g;
			ProDom.addLine(root,op);
		}
	});
};
var Parser = function() {
};
Parser.prototype = {
	error: function(message) {
		if(!this.sync) {
			return;
		}
		var token = this.peek();
		var error = "Error: " + message + " on line " + token.line + " at \"" + token.literal + "\"";
		this.errors.push(error);
		console.log("src/Parser.hx:22:",error);
	}
	,getLabel: function() {
		var label = { name : "internal_" + this.labels.length, idx : 0};
		this.labels.push(label);
		return label.name;
	}
	,peek: function() {
		return this.tokens[this.current];
	}
	,advance: function() {
		this.current++;
		return this.tokens[this.current - 1];
	}
	,consume: function(type,message) {
		var token = this.advance();
		if(token.type != type) {
			this.error(message);
		}
		return token;
	}
	,matches: function(types) {
		var _g = 0;
		while(_g < types.length) {
			var type = types[_g];
			++_g;
			if(this.match(type)) {
				return true;
			}
		}
		return false;
	}
	,match: function(type) {
		if(this.peek().type == type) {
			this.advance();
			return true;
		}
		return false;
	}
	,statement: function() {
		this.sync = true;
		var token = this.peek();
		if(this.match("if")) {
			return this.if_();
		} else if(!this.match("while")) {
			if(!this.match("for")) {
				if(this.match("let")) {
					return this.let();
				} else if(!this.match("func")) {
					if(this.match("print")) {
						var expr = this.expression();
						expr.push("print");
						return expr;
					} else {
						this.advance();
					}
				}
			}
		}
		return [];
	}
	,if_: function() {
		var out = [];
		var end_label = this.getLabel();
		while(this.peek().type != "eof") {
			var next_label = this.getLabel();
			out = out.concat(this.expression());
			out.push("fjmp " + next_label);
			this.consume("then","expected then keyword after if");
			out = out.concat(this.ifBlock());
			out.push("jmp " + end_label);
			out.push("label " + next_label);
			if(this.match("elif")) {
				continue;
			} else if(this.match("else")) {
				out = out.concat(this.ifBlock());
			} else {
				break;
			}
		}
		out.push("label " + end_label);
		return out;
	}
	,'let': function() {
		var name = this.consume("identifier","expected identifier after let keyword").literal;
		var code = ["init_var " + name];
		if(this.match("=")) {
			code = code.concat(this.expression());
			code.push("save_var " + name);
		}
		return code;
	}
	,assignment: function() {
		return [];
	}
	,block: function() {
		var out = ["block"];
		while(this.peek().type != "eof") {
			out = out.concat(this.statement());
			if(this.peek().type == "end") {
				break;
			}
		}
		out.push("end");
		return out;
	}
	,ifBlock: function() {
		var out = ["block"];
		while(this.peek().type != "eof") {
			out = out.concat(this.statement());
			if(["end","elif","else"].indexOf(this.peek().type) != -1) {
				break;
			}
		}
		out.push("end");
		return out;
	}
	,expression: function() {
		return this.equal();
	}
	,logical: function() {
	}
	,equal: function() {
		var expr = this.compare();
		var token = this.peek();
		if(this.matches(["==","!="])) {
			expr = expr.concat(this.compare());
			expr.push(token.type);
		}
		return expr;
	}
	,compare: function() {
		var expr = this.add();
		var token = this.peek();
		if(this.matches(["<",">","<=",">="])) {
			expr = expr.concat(this.add());
			expr.push(token.type);
		}
		return expr;
	}
	,add: function() {
		var expr = this.multiply();
		var token = this.peek();
		if(this.matches(["-","+"])) {
			expr = expr.concat(this.multiply());
			expr.push(token.type);
		}
		return expr;
	}
	,multiply: function() {
		var expr = this.exp();
		var token = this.peek();
		if(this.matches(["*","/","%"])) {
			expr = expr.concat(this.exp());
			expr.push(token.type);
		}
		return expr;
	}
	,exp: function() {
		var expr = this.unary();
		if(this.match("**")) {
			var expr2 = this.unary();
			expr = expr.concat(expr2);
			expr.push("exp");
		}
		return expr;
	}
	,unary: function() {
		var token = this.peek();
		if(LangDef.unary.indexOf(token.type) == -1) {
			return this.primary();
		}
		this.advance();
		var expr = this.primary();
		if(token.type == "-") {
			expr.push("neg");
		} else {
			expr.push("not");
		}
		return expr;
	}
	,primary: function() {
		var token = this.peek();
		if(this.match("(")) {
			var expr = this.expression();
			this.consume(")","expected closing parenthesis");
			return expr;
		} else if(this.match("string")) {
			return ["string \"" + token.literal + "\""];
		} else if(this.match("number")) {
			return ["number " + token.value];
		} else if(this.matches(["true","false"])) {
			return [token.type];
		} else if(this.match("identifier")) {
			return ["load_var " + token.literal];
		} else {
			this.error("unexpected token");
		}
		return [];
	}
	,parse: function(tokens) {
		this.tokens = tokens;
		this.program = [];
		this.current = 0;
		this.labels = [];
		this.errors = [];
		this.sync = true;
		var test = this.block();
		this.consume("eof","expected end of file");
		console.log("src/Parser.hx:211:",test);
		return test;
	}
};
var ProDom = function() { };
ProDom.onLoad = function(func) {
	window.document.addEventListener("DOMContentLoaded",function(event) {
		func();
	});
};
ProDom.getRoot = function() {
	return window.document.querySelector(".container");
};
ProDom.clear = function(elem) {
	elem.innerHTML = "";
};
ProDom.addElem = function(parent,type) {
	var p = window.document.createElement(type);
	parent.appendChild(p);
	return p;
};
ProDom.addLine = function(parent,text,type) {
	if(type == null) {
		type = "p";
	}
	var p = ProDom.addElem(parent,type);
	p.innerHTML = text;
	return p;
};
ProDom.addButton = function(parent,text,func) {
	var e = ProDom.addElem(parent,"button");
	e.innerHTML = text;
	e.addEventListener("click",function(e) {
		func();
	});
	return e;
};
ProDom.addChoice = function(parent) {
	return ProDom.addElem(parent,"ul");
};
ProDom.addOption = function(parent,text,func) {
	var li = ProDom.addElem(parent,"li");
	ProDom.addButton(li,text,func);
	return li;
};
ProDom.confirm = function(text) {
	return window.confirm(text);
};
var Scanner = function() {
	this.synch = true;
	this.errors = [];
	this.tokens = [];
	this.line = 1;
	this.start = 0;
	this.current = 0;
	this.text = "";
};
Scanner.isAlpha = function(c) {
	var code = HxOverrides.cca(c,0);
	if(code > 64 && code < 91) {
		return true;
	}
	if(code > 96 && code < 123) {
		return true;
	}
	return false;
};
Scanner.isNumeric = function(c) {
	var code = HxOverrides.cca(c,0);
	if(code > 47) {
		return code < 58;
	} else {
		return false;
	}
};
Scanner.isAlphanumeric = function(c) {
	if(!Scanner.isAlpha(c)) {
		return Scanner.isNumeric(c);
	} else {
		return true;
	}
};
Scanner.prototype = {
	advance: function() {
		this.current++;
		return this.text.charAt(this.current - 1);
	}
	,peek: function() {
		return this.text.charAt(this.current);
	}
	,addToken: function(type,literal,value) {
		if(literal == null) {
			literal = this.text.substring(this.start,this.current);
		}
		if(type == null) {
			type = literal;
		}
		if(value == null) {
			value = 0.0;
		}
		var token = { type : type, literal : literal, value : value, line : this.line};
		this.tokens.push(token);
		return token;
	}
	,whitespace: function() {
		while(this.current < this.text.length) {
			var c = this.text.charAt(this.current);
			if([" ","\t","\r"].indexOf(c) != -1) {
				this.advance();
			} else if(c == "\n") {
				this.line++;
				this.advance();
			} else {
				break;
			}
		}
		return this.current != this.start;
	}
	,lex: function() {
		var leng = 0;
		var literal = "";
		var _g = 0;
		var _g1 = LangDef.lexemes;
		while(_g < _g1.length) {
			var l = _g1[_g];
			++_g;
			if(leng >= l.length) {
				continue;
			}
			var match = true;
			var _g2 = 0;
			var _g3 = l.length;
			while(_g2 < _g3) {
				var i = _g2++;
				if(i + this.current >= this.text.length) {
					break;
				}
				var c = this.text.charAt(i + this.current);
				if(l.charAt(i) != c) {
					match = false;
					break;
				}
			}
			if(!match) {
				continue;
			}
			leng = l.length;
			literal = l;
		}
		if(literal.length > 0) {
			this.current += literal.length;
			this.addToken();
			return true;
		}
		return false;
	}
	,number: function() {
		if(!Scanner.isNumeric(this.peek())) {
			return false;
		}
		this.advance();
		var has_dot = false;
		while(this.current < this.text.length) {
			var c = this.peek();
			if(Scanner.isNumeric(c)) {
				this.advance();
			} else if(c == ".") {
				if(has_dot) {
					this.error("only one '.' is allowed per number literal");
				} else {
					has_dot = true;
				}
				this.advance();
			} else {
				break;
			}
		}
		var lit = this.text.substring(this.start,this.current);
		var val = parseFloat(lit);
		this.addToken("number",lit,val);
		return true;
	}
	,string: function() {
		var delim = this.peek();
		if(["'","\""].indexOf(delim) == -1) {
			return false;
		}
		this.advance();
		while(this.current < this.text.length) {
			var c = this.peek();
			if(c == delim) {
				this.advance();
				break;
			} else if(c == "\n") {
				this.line += 1;
			}
			this.advance();
		}
		if(this.current > this.text.length) {
			this.error("unexpected EOF");
		} else {
			var lit = this.text.substring(this.start + 1,this.current - 1);
			this.addToken("string",lit);
		}
		return true;
	}
	,identifier: function() {
		if(!Scanner.isAlpha(this.peek())) {
			return false;
		}
		while(this.current < this.text.length && Scanner.isAlphanumeric(this.peek())) this.advance();
		var token = this.addToken();
		if(LangDef.keywords.indexOf(token.literal) == -1) {
			token.type = "identifier";
		}
		return true;
	}
	,comment: function() {
		if(this.peek() != "#") {
			return false;
		}
		while(this.current < this.text.length) {
			if(this.peek() == "\n") {
				break;
			}
			this.advance();
		}
		return true;
	}
	,error: function(message) {
		if(!this.synch) {
			return;
		}
		this.synch = false;
		var err = "Error: " + message + " on line " + this.line;
		console.log("src/Scanner.hx:149:",err);
		this.errors.push(err);
	}
	,scan: function(text) {
		this.text = text;
		this.current = 0;
		this.start = 0;
		this.line = 1;
		this.tokens = [];
		this.errors = [];
		while(this.current < this.text.length) {
			this.synch = true;
			this.start = this.current;
			if(!this.whitespace()) {
				if(!this.comment()) {
					if(!this.string()) {
						if(!this.number()) {
							if(!this.lex()) {
								if(!this.identifier()) {
									var c = this.peek();
									this.error("unexpected character \"" + c + "\"");
									break;
								}
							}
						}
					}
				}
			}
		}
		this.addToken("eof","eof",0);
		var _g = 0;
		var _g1 = this.tokens;
		while(_g < _g1.length) {
			var to = _g1[_g];
			++_g;
			console.log("src/Scanner.hx:172:",to);
		}
		if(this.errors.length > 0) {
			this.tokens = [];
		}
		return this.tokens;
	}
};
var haxe_iterators_ArrayIterator = function(array) {
	this.current = 0;
	this.array = array;
};
haxe_iterators_ArrayIterator.prototype = {
	hasNext: function() {
		return this.current < this.array.length;
	}
	,next: function() {
		return this.array[this.current++];
	}
};
if(typeof(performance) != "undefined" ? typeof(performance.now) == "function" : false) {
	HxOverrides.now = performance.now.bind(performance);
}
LangDef.keywords = "act scene shot block if elif else then while for func end continue break return let new next not and or true false print".split(" ");
LangDef.lexemes = "+ - * / % ** < > <= >= == != ( ) [ ] { } , . ' \" = += -= *= /= %=".split(" ");
LangDef.block = "act scene shot block if while for func".split(" ");
LangDef.arith = "+ - * / % **".split(" ");
LangDef.unary = "- not".split(" ");
Main.main();
})({});

//# sourceMappingURL=main.js.map