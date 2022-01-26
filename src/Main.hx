import ProDom;
import Scanner;
import Loader;
class Main {
    static function main(){
        var s = new Scanner();
        var p = new Parser();
        var tokens = s.scan(Loader.getText(""));
        var ops = p.parse(tokens);
        ProDom.onLoad(() -> {
            var root = ProDom.getRoot();
            for (op in ops) {
                ProDom.addLine(root, op);
            }
        });
        // ProDom.onLoad(() -> {
        //     var root = ProDom.getRoot();
        //     ProDom.addLine(root, "howdy doody");
        //     ProDom.addButton(root, "click me", () -> {
        //         ProDom.clear(root);
        //         var choice = ProDom.addChoice(root);
        //         var options = ["spam", "eggs", "bacon", "tofu"];
        //         for (option in options) {
        //             ProDom.addOption(choice, option, () -> {
        //                 if (!ProDom.confirm("Are you sure you want " + option + "?")){return;}
        //                 ProDom.clear(root);
        //                 ProDom.addLine(root, "You chose " + option);
        //             });
        //         }
        //     });
        // });
    }
}