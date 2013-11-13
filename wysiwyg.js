/*
Copyright (c) 2013, Gabriel N Forti
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
POSSIBILITY OF SUCH DAMAGE.
*/

/*
 * What you see is what you get (wysiwyg)
 * This is a very basic word processor.  Some Features were removed and
 * to keep the editor as minimal as possible.
 * Each DIV can be an instance of it's own editor
 */
function wysiwyg(id) {

    // Utility
    var Dom = {
        $ : function (id) {
            var elem = id;
            if (this.oType(id) == "string") {
                    elem = document.getElementById(id);
                    elem = (elem && elem.id && elem.id == id ? elem : null);
            }
            return elem;
        },
        oType : function (o) {
            var listTypes = [], types = "Boolean Number String Function Array Date RegExp Object".split(" "),i = types.length;
            while (i--) listTypes["[object " + types[i] + "]"] = types[i].toLowerCase();
            return listTypes[Object.prototype.toString.call(o)] || "object";
        },
        Event : {
            add : function (obj, evt, fn) {
                obj = Dom.$(obj);
                if (!obj) return this;
                if (obj.addEventListener) {
                    obj.addEventListener(evt, fn, false);
                } else if (obj.attachEvent) {
                    obj.attachEvent('on' + evt, fn);
                }
                return this;
            }
        },
        /*
         *  Use to add DOM elements to the document.
         *  Features were removed from the create
         *  function.  Will not fully work in IE
         */
        Element : {
            add : function (el, dest, before) {
                if (!el || !dest) return this;
                var before = (before ? true : false);
                if (before)
                    dest.insertBefore(el, dest.firstChild);
                else
                    dest.appendChild(el);
                return this;
            },
            create : function (tag, properties, text) {
                var elem = document.createElement(tag);

                if (properties && Dom.oType(properties) == "object") {
                    try {
                        for (var prop in properties) {
                            if (!properties.hasOwnProperty(prop)) continue;

                            if (prop == "type" || prop == "name") {
                                elem[prop] = properties[prop];
                            } else if (prop == "class") {
                                elem.className = properties[prop];
                            } else {
                                elem.setAttribute(prop, properties[prop]);
                            }
                        }
                    } catch (e) {}
                }

                if (text && Dom.oType(text) == "string" && elem.appendChild) {
                    var contents = document.createTextNode(text);
                    elem.appendChild(contents);
                }

                return elem;
            }
        }
    };

    //Private properties
    var properties = {
            'ID' : "",
            'editor' : null,
            'cmdID' : "",
            'commands' : []
    };

    //Private Methods
    var methods = {

        init : function (id) {

            properties.ID = id;
            properties.cmdID = properties.ID + "_commands";
            properties.editor = Dom.$(id);

            methods.enableEditor(true);
            properties.editor.style.border = "1px solid black";
            Dom.Event.add(properties.editor, "mouseup", methods.showCommands);

            // create the command prompt
            var fragment = document.createDocumentFragment(),
            divCmd = Dom.Element.create("div", {
                'id' : properties.cmdID
            });

            divCmd.style.position = "absolute";
            divCmd.style.visibility = "hidden";
            divCmd.style.padding = "0.1em";
            divCmd.style.border = "1px solid #999";
            divCmd.style.backgroundColor = "#eee";
            divCmd.style.top = "0px";
            divCmd.style.left = "0px";
            divCmd.style.borderRadius = "5px";
            divCmd.style.boxShadow = "3px 3px 3px #888888";

            Dom.Event.add(divCmd, "click", methods.showCommands);

             // create the event to run when a command is called
            var btnEvent = function (e) {
                    var cmd = "";
                    var e = e || window.event;
                    var eventTarget = (e.target ? e.target : (e.srcElement ? e.srcElement : document));

                    if (eventTarget.id) {
                            cmd = eventTarget.id.split("_").pop().slice(0);
                    }

                    methods.command(cmd);
            };

             // define the command metadata
            properties.commands["bold"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADCSURBVCjPY/jPgB8yUEtBeUL5+ZL/Be+z61PXJ7yPnB8sgGFCcX3m/6z9IFbE/JD/XucxFOTWp/5PBivwr/f77/gfQ0F6ffz/aKACXwG3+27/LeZjKEioj/wffN+n3vW8y3+z/Vh8EVEf/N8LLGEy3+K/2nl5ATQF/vW+/x3BCrQF1P7r/hcvQFPgVg+0GWq0zH/N/wL1aAps6x3+64M9J12g8p//PZcCigKbBJP1uvvV9sv3S/YL7+ft51SgelzghgBKWvx6E5D1XwAAAABJRU5ErkJggg==",
                    'title' : "Bold"
            };
            properties.commands["italic"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAABxSURBVCjPY/jPgB8yUFtBdkPqh4T/kR+CD+A0Ie5B5P/ABJwmxBiE//f/gMeKkAlB/90W4FHg88Dzv20ATgVeBq7/bT7g8YXjBJf/RgvwKLB4YPFfKwCnAjMH0/8a/3EGlEmD7gG1A/IHJDfQOC4wIQALYP87Y6unEgAAAABJRU5ErkJggg==",
                    'title' : "Italic"
            };
            properties.commands["underline"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAQAAAC1+jfqAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAACjSURBVCjPY/jPgB8yEKmgPKH8ffn/0n4IL3F99P+QAjQTyveX/IexIwWCz2NYUbw/7z/CYK/9GApy92cgKXDEVJC+PxFJgQWmgoT9kUgK9DEVROwPRFKghqnAv9/7v2MAhK3iINePocBNwf69xXlDhf8Myg4y58UUsISkmYL+fI39ivul+0UMSA/q/wza/1X+y/0X/y/0n+c/+3/m/6SbgAsCAM8i/W7eee6fAAAAAElFTkSuQmCC",
                    'title' : "Underline"
            };
            properties.commands["insertunorderedlist"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADqSURBVDjLY/j//z8DJZiBKgbkzH9cMHXX6wcgmiwDQJq3nv/4H0SD+OXl5dlA/L+kpOR/QUHB/+zs7P+pqan/ExIS/kdGRv4PDg7+T10XDHwgpsx8VNC56eWDkJ675Hmhbf3zB0uPvP1fuvQpOBDj4uKyIyIi/gcGBv738vL67+zs/N/Gxua/iYnJf11d3f9qamqogRjQcaugZPHjB66V14ZqINrmXyqIn3bvgXXeJfK8ANLcv+3lfxAN4hsZGWVra2v/V1FR+S8nJ/dfXFz8v5CQ0H8eHp7/7Ozs/5mZmVEDEWQzRS6gBAMAYBDQP57x26IAAAAASUVORK5CYII=",
                    'title' : "Bullet List"
            };
            properties.commands["insertorderedlist"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAD3SURBVDjLY/j//z8DJRhM5Mx/rLLo8Lv/ZBsA0kyRATBDYOzy8vJsIP5fUlLyv6Cg4H92dvb/1NTU/wkJCf8jIyP/BwcH/8fqgkUHSXcFA1UCce7+t/9n7Xn9P2LiPRWyXRDae0+ld8tL8rwQ1HVHpXPTc7jmuLi47IiIiP+BgYH/vby8/js7O/+3sbH5b2Ji8l9XV/e/mpoaaiC2rX/+v3HN0/81q54OUCCWL3v8v3Tp4//Fix+T7wKQZuu8S+THAkgzzAVGRkbZ2tra/1VUVP7Lycn9FxcX/y8kJPSfh4fnPzs7+39mZmbUQARpBGG7oisddA9EAPd/1bRtLxctAAAAAElFTkSuQmCC",
                    'title' : "Numbered List"
            };
            properties.commands["indent"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADzSURBVDjLY/z//z8DJYCJgUJAsQEsMEZ5efn/f//+Mfz58weOf//+Dce/fv2C0yC8d+9eRpA+RkrDAO6Czi3vrpT7COnA+LGxsdeRbUTHZ86c0UQx4MfvvwyZi55cvXX7a8jeZvXrQEWKuDSDMAyAvdCy+cV/EW42hk/ffzOcvvP1zMNbX+JOTdW7TowX4GGQs/jFlVfvvzPdvfop+OxM/euenp5XYLb9/PkTbjPMWw8fPtRB8cK3n/8YVuUpasG99OOHCrqzkWMDwwUUx4K3t/d/fIGGnCZA+PPnz1ROB7a2tv+xBRayrR8+fGDEGQsDlpkACSYJhTJIjokAAAAASUVORK5CYII=",
                    'title' : "Indent"
            };
            properties.commands["outdent"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAADxSURBVDjLY/z//z8DJYCJgUJAsQEsMEZ5efn/f//+Mfz58weOf//+Dce/fv2C0yC8d+9eRpA+RkrDgAWZ07rx3ZVqfyEdEDs2NvY6so3o+MyZM5pwAwL67msqSLCv4WFjgTsHqEgRl2YQhgFG3867mpJirIs0JdlNmBiZGR6++c7QGyXDSKwXwGHgWHldU1KOYy03B8e/2YmSYC94enpegdn28+dPuM0wbz18+FAH7oX97ZrXgZRW9MxnV2Am//jxQwXd2cixgeICqsSCt7f3f3yBhpwmQPjz589UTge2trb/sQUWsq0fPnxgxBoLA5qZANTo8jopO/z6AAAAAElFTkSuQmCC",
                    'title' : "Outdent"
            };

            properties.commands["removeformat"] = {
                    'src' : "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABGdBTUEAAK/INwWK6QAAABl0RVh0U29mdHdhcmUAQWRvYmUgSW1hZ2VSZWFkeXHJZTwAAAInSURBVDjLY/j//z8DJZiBZgY4tN9wcO6+0erZd2uKc+fNfoeWGxMcW27Msiq+3GWUdIZXL/okI14D7JqvB+csf3Rv4p6X//t3Pf/fvf35/8Ilj3471V3bph9zmougC6xrr8mETbu7q3jl40/FKx5+LVzy8Ltd+eUZBvGnOYjygk3llfKCZY++u3fcWutcd21B07on/61yz88kKgwsCi8qJc++9yhu2p37ppnnQ4C4oWblo/9WOReXEjTANOsCs1PD9VVZ8+9/N0k7m6Yfe5LLOPFMR+Wyh/9dqq5eUvc6xIbXALOs8zEZc+9/C+q+ddEw/rSfXuRxLfP0swuqgAYEt934pOq2nxenAUbJZ0TjJt9+Vbn80X+v5huXrbLOb7LMOLfVterqjYVNbf+3BKv+2+PE8m+nK/MjIK5AMcAg9jSjfcnl2SC/mqedQQmstpjsq+dLbP5/39r7/9+1Hf+/rij6fzpb988uZ5ZcsAL9mFNcwOhxKV3y8H9Ez603OkHHbGGaVVz3C693EXz3Daj5/yTf///LBf//b1P8/7rL4f9OF+Z7kFDPOLcutv/Wv4QJt/8HNF9/qx1wpFfZaa+Akv0eLW3fw4v2OLH+/3d23X9k8L5e4j/IO0Sld6B/H3+Zm/z/P1DTjzKG/++A+GEG83+g+BOiDDgcLtVwMkX197Nyxf+vKln/301h/L/Xl+XPDlfmKqJz3ZFw2QqgjfehsfAYpBkkDgCxi6Nciw8o3QAAAABJRU5ErkJggg==",
                    'title' : "Remove Format"
            };
            
            // add the commands to the prompt
            var cmd;
            for (cmd in properties.commands) {
                if (!properties.commands.hasOwnProperty(cmd)) continue;

                var button = Dom.Element.create("img", {
                    "id" : properties.ID + "_" + cmd,
                    "title" : properties.commands[cmd].title,
                    "class" : "wysiwyg",
                    "src" : properties.commands[cmd].src
                });

                button.style.cursor = "pointer";
                button.style.padding = "0.2em";
                button.style.marginRight = "0.2em";
                button.style.marginLeft = "0.2em";
                button.style.border = "1px solid #ddd";
                button.style.borderRadius = "3px";

                Dom.Event.add(button, "click", btnEvent);
                Dom.Element.add(button, divCmd);

            }

            Dom.Element.add(divCmd, fragment).add(fragment, document.body);

        },
        // get the users mouse cords to place the command prompt
        getMousePosition : function (e) {
            var e = e || window.event;
            var cords = {
                    'x' : 0,
                    'y' : 0
            };
            var d = document;
            if (e) {
                cords.x = parseInt(e.clientX ? (e.clientX + (d.documentElement.scrollLeft ? d.documentElement.scrollLeft : d.body.scrollLeft)) : e.pageX, 10);
                cords.y = parseInt(e.clientY ? (e.clientY + (d.documentElement.scrollTop ? d.documentElement.scrollTop : d.body.scrollTop)) : e.pageY, 10);
            }
            return cords;
        },
        showCommands : function (e) {
            var cords = methods.getMousePosition(e);
            var cmdBar = Dom.$(properties.cmdID),
            text = methods.getSelectionText();

            if (cmdBar && text.length) {
                    cmdBar.style.top = parseInt(cords.y - 50, 10) + "px";
                    cmdBar.style.left = parseInt(cords.x + 10, 10) + "px";
                    cmdBar.style.visibility = "visible";
                    properties.editor.style.borderColor = "Gold";
            } else {
                    methods.hideCommands();
            }
        },
        hideCommands : function (e) {
            var cmdBar = Dom.$(properties.cmdID);
            if (cmdBar) {
                    cmdBar.style.visibility = "hidden";
                    properties.editor.style.borderColor = "black";
            }
            return this;
        },
        // get the selected text user has selected in the DOM
        getSelectionText : function () {
            if (window.getSelection) {
                return window.getSelection().toString();
            } else if (document.selection && document.selection.createRange) {
                return document.selection.createRange().text;
            }
            return "";
        },
        command : function (cmd) {
            if (!cmd in properties.commands) return this;
            document.execCommand(cmd, false, null);
            return methods.clearSelection().hideCommands();
        },
        clearSelection : function () {
            if (document.selection)
                document.selection.empty();
            else if (window.getSelection)
                window.getSelection().removeAllRanges();
            return this;
        },
        html : function () {
            return properties.editor.innerHTML;
        },
        enableEditor : function (enable) {
            properties.editor.contentEditable = (enable || null == enable ? true : false);
            return this;
        }
    };

    //public scope
    var exposedMethods = {
        html : function () {
                return methods.html();
        },
        enableEditor : function () {
                return methods.enableEditor(true);
        },
        disableEditor : function () {
                return methods.enableEditor(false);
        }
    };

    methods.init(id);
    return exposedMethods;
}

