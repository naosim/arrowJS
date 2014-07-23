var START_NEST_CHARS = '([{';
var END_NEST_CHARS = ')]}';
var END_CHARS = ',;';
var ABC = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ$1234567890';

var ARROW = '=>';
var ARROW_LENGTH = ARROW.length;

String.prototype.lastIndex = function() {
    return this.length - 1;
}

String.prototype.contains = function(str) {
    return this.indexOf(str) != -1;
}

var exchange = function(ajsText) {
    // パラメータ部分の開始位置を返す
    var getArrowStartIndex = function(beforeArrow) {
        beforeArrow = beforeArrow.trim();
        var lastChar = beforeArrow.charAt(beforeArrow.lastIndex());
        if(lastChar !== ')') {
            for(var i = beforeArrow.length - 1; i >= 0; i--) {
                var c = beforeArrow.charAt(i);
                if(!ABC.contains(c)) return i + 1;
            }
        } else {
            return beforeArrow.lastIndexOf('(');
        }
    };

    // 処理部分の終端を返す
    var getArrowEndIndex = function(afterArrow) {
        afterArrow = afterArrow.trim();
        var nest = 0;
        for(var i = 0; i < afterArrow.length; i++) {
            var c = afterArrow.charAt(i);
            if(START_NEST_CHARS.contains(c)) {
                nest++;
            } else if(END_NEST_CHARS.contains(c)) {
                nest--;
                if(nest <= 0) {
                    return i;
                }
            } else if(nest <= 0 && END_CHARS.contains(c)) {
                return i - 1;
            }

        }
    };

    var getParams = function(params) {
        params = params.trim();
        if(params.charAt(0) === '(') {
            return params.substring(1, params.length - 1);
        } else {
            return params;
        }
    }

    var getProcess = function(process) {
        process = process.trim();
        if(process.charAt(0) === '{') {
            return process.substring(1, process.length - 1);
        } else {
            return 'return ' + process + ';';
        }
    };

    var arrowIndex = 0;
    // アローがなくなるまで繰り返す
    while((arrowIndex = ajsText.indexOf(ARROW)) != -1) {
        var beforeArrow = ajsText.substring(0, arrowIndex).trim();
        var afterArrow = ajsText.substring(arrowIndex + ARROW_LENGTH).trim();

        var startIndex = getArrowStartIndex(beforeArrow);
        var endIndex = getArrowEndIndex(afterArrow);

        var params = beforeArrow.substring(startIndex, arrowIndex);
        params = getParams(params);
        var process = afterArrow.substring(0, endIndex + 1);
        process = getProcess(process);
        var afterFunction = afterArrow.trim().substring(endIndex + 1);
        if(!afterFunction) afterFunction = '';

        ajsText = ajsText.substring(0, startIndex)
            + 'function(' + params + ') { ' + process + ' }' + afterFunction;
    }
    return ajsText;
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
}



// var input = 'var b = \'こん$に\\\'ちは\'\n'
//     + 'var c = "こ\\ん=>ばん}は"\n'
//     + 'var a = s => s.length;';

// var input = 'var a = s => {\n s++; \n return s.length; }';
// var input = 'hoge( s => s.substring(3, 10), b);';
// var input = 'hoge( s => t => s + t  , b );';
// var input = 'hoge( s => s + t  , b );';
// var input = 'var a = (s) => s.length;';
var input = 'var a =s1d=> s.length;';

var stringEscape = StringEscape();
var escapedProgram = stringEscape.escape(input);
escapedProgram = exchange(escapedProgram);
var output = stringEscape.unescape(escapedProgram);
console.log(output);

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
