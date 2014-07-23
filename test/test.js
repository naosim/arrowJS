var assert = require("assert")
var exchange = require("src/index").exchange;

describe('結合試験', function(){
  describe('引数部分', function(){
    it('括弧無し', function(){
      var input = ' \t var a = s => s.length;';
      assert.equal(' \t var a = function(s) { return s.length; };', exchange(input));
    });

    it('括弧あり', function(){
      var input = ' \t var a = (s) => s.length;';
      assert.equal(' \t var a = function(s) { return s.length; };', exchange(input));
    });

    it('引数無し', function(){
      var input = ' \t var a = () => s.length;';
      assert.equal(' \t var a = function() { return s.length; };', exchange(input));
    });

    it('複数引数', function(){
      var input = ' \t var a = (b, c, d) => s.length;';
      assert.equal(' \t var a = function(b, c, d) { return s.length; };', exchange(input));
    });

    it('可変長引数', function(){
      var input = ' \t var a = (...args) => s.length;';
      assert.equal(' \t var a = function(...args) { return s.length; };', exchange(input));
    });

    it('括弧前後のスペース無し', function(){
      var input = ' \t var a =(a)=> s.length;';
      assert.equal(' \t var a =function(a) { return s.length; };', exchange(input));
    });
  });

  describe('処理部分', function(){
    it('1行', function(){
      var input = ' \t var a = s => s.length;';
      assert.equal(' \t var a = function(s) { return s.length; };', exchange(input));
    });

    it('ブロック', function(){
      var input = ' \t var a = (s) => { return s.length; };';
      assert.equal(' \t var a = function(s) { return s.length; };', exchange(input));
    });

    it('複数行', function(){
      var input = '  var a = (s) => { \n    s++;\n    return s.length; };';
      assert.equal('  var a = function(s) { \n    s++;\n    return s.length; };', exchange(input));
    });
  });

  describe('複雑', function(){
    it('2重', function(){
      var input = ' \t var a = s => t => s + t;';
      assert.equal(' \t var a = function(s) { return function(t) { return s + t; }; };', exchange(input));
    });
    it('アロー関数の中にアロー関数', function(){
      var input = ' \t var a = s => { var b = (t, r) => { return t + r}; return b(1, 2) + s;}';
      assert.equal(' \t var a = function(s) { var b = function(t, r) { return t + r }; return b(1, 2) + s; }', exchange(input));
    });
  });




});
