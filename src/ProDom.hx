import haxe.macro.Expr.Catch;
import js.Browser.document;
import js.Browser.window;
import js.html.Element;

class ProDom{
    public static function onLoad(func : () -> Void) {
        document.addEventListener("DOMContentLoaded", function(event) {
            func();
        });
    }
    public static function getRoot() {
        return document.querySelector(".container");
    }
    public static function clear(elem : Element) {
        elem.innerHTML = "";
    }
    public static function addElem(parent : Element, type: String){
        var p = document.createElement(type);
        parent.appendChild(p);
        return p;
    }
    public static function addLine(parent : Element, text : String, type = "p"){
        var p = addElem(parent, type);
        p.innerHTML = text;
        return p;
    }
    public static function addButton(parent : Element, text : String, func : () -> Void) {
        var e = addElem(parent, "button");
        e.innerHTML = text;
        e.addEventListener("click", (e) -> func());
        return e;
    }
    public static function addChoice(parent : Element) {
        return addElem(parent, "ul");
    }
    public static function addOption(parent : Element, text : String, func : () -> Void) {
        var li = addElem(parent, "li");
        addButton(li, text, func);
        return li;
    }
    public static function confirm(text : String): Bool {
        return window.confirm(text);
    }
}