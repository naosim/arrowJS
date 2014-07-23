arrowJS
=======

AltJS that can use Arrow function

examples
=======
- short
~~~
s => s.length
~~~
 
- long
~~~~
s => {
  s += 'aa';
  return s.length;
}
~~~~

- params
~~~
(a, b, c) => a + b + c
~~~

- this scope
~~~
this.b = 1;
() => {
  this.b += 2;
}
~~~
