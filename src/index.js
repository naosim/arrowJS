var START_NEST_CHARS = '([{';
var END_NEST_CHARS = ')]}';
var END_CHARS = ',;';
var ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$1234567890';

var ARROW = '=>';
var ARROW_LENGTH = ARROW.length;

String.prototype.lastIndex = function() {
    return this.length - 1;
};

String.prototype.lastChar = function() {
    return this.charAt(this.lastIndex());
};

String.prototype.contains = function(str) {
    return this.indexOf(str) != -1;
};

String.prototype.startWith = function(str) {
    return this.indexOf(str) === 0;
};

var exchange = function(ajsText, thisBindFlag) {
    // パラメータ部分の開始位置を返す
    var getParamStartIndex = function(beforeArrow) {
        if(beforeArrow.lastChar() !== ')') {
            // 単語の始まりを探す
            for(var i = beforeArrow.length - 1; i >= 0; i--) {
                var c = beforeArrow.charAt(i);
                if(!ABC.contains(c)) return i + 1;
            }
        } else {
            return beforeArrow.lastIndexOf('(');
        }
    };

    // 処理部分の終端を返す
    var getProcessEndIndex = function(afterArrow) {
        var getBlockEndIndex = function(afterArrow) {
            var nest = 0;
            for(var i = 0; i < afterArrow.length; i++) {
                var c = afterArrow.charAt(i);
                if(c === '{') {
                    nest++;
                } else if(c === '}') {
                    nest--;
                    if(nest == 0) {
                        return i;
                    }
                }
            }
        };

        var getLineEndIndex = function(afterArrow) {
            // ネストゼロで終了文字を探す
            var nest = 0;
            for(var i = 0; i < afterArrow.length; i++) {
                var c = afterArrow.charAt(i);
                if(START_NEST_CHARS.contains(c)) {
                    nest++;
                } else if(END_NEST_CHARS.contains(c)) {
                    nest--;
                } else if(nest <= 0 && END_CHARS.contains(c)) {
                    return i - 1;
                }
            }
        };

        return afterArrow.startWith('{') ? getBlockEndIndex(afterArrow) : getLineEndIndex(afterArrow);
    };

    var getParams = function(beforeArrow, startIndex) {
        var params = beforeArrow.substring(startIndex, arrowIndex).trim();
        return params.startWith('(') ? params.substring(1, params.length - 1) : params;
    };

    var getProcess = function(afterArrow, endIndex) {
        var process = afterArrow.substring(0, endIndex + 1).trim();
        if(process.startWith('{')) {
            return process.substring(1, process.length - 1).trimRight() + ' ';
        } else {
            return ' return ' + process + '; ';
        }
    };

    var hasThis = function(process) {
        return thisBindFlag ? process.contains('this.') : false;
    };

    var stringEscape = StringEscape();
    ajsText = stringEscape.escape(ajsText);

    var arrowIndex = 0;
    // アローがなくなるまで繰り返す
    while((arrowIndex = ajsText.lastIndexOf(ARROW)) != -1) {
        var beforeArrow = ajsText.substring(0, arrowIndex).trimRight();
        var afterArrow = ajsText.substring(arrowIndex + ARROW_LENGTH).trimLeft();

        var paramStartIndex = getParamStartIndex(beforeArrow);
        var processEndIndex = getProcessEndIndex(afterArrow);

        var params = getParams(beforeArrow, paramStartIndex);
        var process = getProcess(afterArrow, processEndIndex);

        var bind = hasThis(process) ? '.bind(this)' : '';

        ajsText = beforeArrow.substring(0, paramStartIndex)
            + 'function(' + params + ') {' + process + '}'
            + bind + afterArrow.trimLeft().substring(processEndIndex + 1);
    }
    return stringEscape.unescape(ajsText);
};

var StringEscape = function() {
    var map = {};
    var index = 0;

    var escapeWithChar = function(text, char) {
        var startIndex = 0;
        var endIndex = 0;
        while((startIndex = text.indexOf(char, startIndex)) != -1) {
            endIndex = startIndex;
            while((endIndex = text.indexOf(char, endIndex + 1)) != -1) {
                if(text.charAt(endIndex - 1) !== '\\') break;
            }

            if(endIndex === -1) break;

            var str = text.substring(startIndex, endIndex + 1);
            var key = '@@@@@@@@' + index + '@@@@@@@@';
            map[key] = str;
            text = text.replace(str, key);
            index++;
            startIndex = endIndex + 1;
        }

        return text;
    };

    return {
        escape: function(text) {
            text = escapeWithChar(text, '\'');
            text = escapeWithChar(text, '"');
            return text;

        },
        unescape: function(text) {
            for(var key in map) {
                text = text.replace(key, map[key]);
            }
            return text;

        },
    }
};

module.exports.StringEscape = StringEscape;
module.exports.exchange = exchange;

/*
基本パターン
String.format('function(%s) { %s }', params, process);

----------------
始まりを探す
ケース
var a = s => s.length;
var a =s => s.length;
var a = (s => s.length)
var a = (s) => s.length
var a = (s, t) => s.length

アローの直前が ) の場合、次の ( が開始位置
アローの直前が ) でない場合、次の 文字以外 が開始位置

----------------
入力パラメータを探す
開始位置からアローの間の文字列をトリムし、
( ) を消したものがパラメータ

----------------
終わりを探す
ケース
s => s.length
hoge(s => s.length);
hoge(s => s.length, b);
hoge(s => s.substring(3, 10), b);
hoge( s => t => s + t , b);

function(s) {
    return function(t) {
        return s + t;
    }
}

ネスト開始系 ( [ {
ネスト終了系　) ] }
文字列ネスト系 " '
終了系 ; ,

ネスト開始系が来たらネスト度++
ネスト終了系が来たらネスト度--
  → ネスト度0以下なら終端
ネスト度0で終了系が来たら終端

----------------
処理を探す
アローから終端までの文字列をトリムし、
{ } を消したものがパラメータ

*/
