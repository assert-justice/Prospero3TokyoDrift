class LangDef{
    public static var keywords = "act scene shot block if elif else then while for func end continue break return let new next not and or true false print".split(" ");
    public static var lexemes = "+ - * / % ** < > <= >= == != ( ) [ ] { } , . ' \" = += -= *= /= %=".split(" ");
    public static var block = "act scene shot block if while for func".split(" ");
    public static var arith = "+ - * / % **".split(" ");
    public static var unary = "- not".split(" ");
}