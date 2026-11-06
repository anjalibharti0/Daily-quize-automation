export const questions = [
  {
    id: 'cpp-post-increment',
    topic: 'Output Prediction',
    language: 'C++',
    question: 'What will be the output of this program?',
    code: `#include <iostream>
using namespace std;

int main() {
    int x = 5;
    cout << x++ + 2;
    return 0;
}`,
    options: [
      { key: 'A', text: '5' },
      { key: 'B', text: '6' },
      { key: 'C', text: '7' },
      { key: 'D', text: '8' },
    ],
    answer: 'C',
    explanation:
      'The post-increment operator returns the current value (5) and then increments x to 6. So the expression becomes 5 + 2, which prints 7.',
  },
  {
    id: 'python-reverse-slice',
    topic: 'Slicing',
    language: 'Python',
    question: 'What is the output of this Python code?',
    code: `nums = [1, 2, 3, 4]
print(nums[::-1])`,
    options: [
      { key: 'A', text: '[1, 2, 3, 4]' },
      { key: 'B', text: '[4, 3, 2, 1]' },
      { key: 'C', text: '[1, 4, 3, 2]' },
      { key: 'D', text: 'Error' },
    ],
    answer: 'B',
    explanation:
      'A step of -1 walks the list backwards, so [::-1] returns a reversed copy: [4, 3, 2, 1]. The original list is unchanged.',
  },
  {
    id: 'js-typeof-null',
    topic: 'Data Types',
    language: 'JavaScript',
    question: 'What is the output of this code?',
    code: `console.log(typeof null);`,
    options: [
      { key: 'A', text: '"null"' },
      { key: 'B', text: '"object"' },
      { key: 'C', text: '"undefined"' },
      { key: 'D', text: '"boolean"' },
    ],
    answer: 'B',
    explanation:
      'typeof null returns "object". This is a long-standing quirk in JavaScript: null is a primitive, but its type tag was historically the same as objects.',
  },
  {
    id: 'java-string-immutable',
    topic: 'Strings',
    language: 'Java',
    question: 'What will be printed?',
    code: `String s = "Yuva";
s.concat("Hive");
System.out.println(s);`,
    options: [
      { key: 'A', text: 'YuvaHive' },
      { key: 'B', text: 'Yuva' },
      { key: 'C', text: 'Hive' },
      { key: 'D', text: 'Compilation error' },
    ],
    answer: 'B',
    explanation:
      'Java strings are immutable. concat() returns a new string, but the result is not assigned back to s, so s still holds "Yuva".',
  },
  {
    id: 'dsa-binary-search',
    topic: 'Complexity',
    language: 'DSA',
    question:
      'What is the time complexity of binary search on a sorted array of n elements?',
    code: '',
    options: [
      { key: 'A', text: 'O(n)' },
      { key: 'B', text: 'O(n log n)' },
      { key: 'C', text: 'O(log n)' },
      { key: 'D', text: 'O(1)' },
    ],
    answer: 'C',
    explanation:
      'Each comparison halves the remaining search space, so binary search needs at most log2(n) steps: O(log n). The array must already be sorted.',
  },
  {
    id: 'python-list-alias',
    topic: 'Mutability',
    language: 'Python',
    question: 'What is the output of this code?',
    code: `a = [1, 2, 3]
b = a
b.append(4)
print(a)`,
    options: [
      { key: 'A', text: '[1, 2, 3]' },
      { key: 'B', text: '[1, 2, 3, 4]' },
      { key: 'C', text: '[4, 1, 2, 3]' },
      { key: 'D', text: 'Error' },
    ],
    answer: 'B',
    explanation:
      'b = a copies the reference, not the list, so both names point to the same list object. Appending through b also changes a.',
  },
  {
    id: 'js-loose-vs-strict-equality',
    topic: 'Operators',
    language: 'JavaScript',
    question: 'What is the output of this code?',
    code: `console.log(0 == "0", 0 === "0");`,
    options: [
      { key: 'A', text: 'true true' },
      { key: 'B', text: 'false false' },
      { key: 'C', text: 'true false' },
      { key: 'D', text: 'false true' },
    ],
    answer: 'C',
    explanation:
      '== performs type coercion, so "0" becomes 0 and the comparison is true. === compares both value and type, so a number and a string are not equal.',
  },
  {
    id: 'cpp-pass-by-reference',
    topic: 'Functions',
    language: 'C++',
    question: 'What will be the output of this program?',
    code: `void change(int &x) {
    x = 10;
}

int main() {
    int a = 5;
    change(a);
    cout << a;
    return 0;
}`,
    options: [
      { key: 'A', text: '5' },
      { key: 'B', text: '10' },
      { key: 'C', text: '0' },
      { key: 'D', text: 'Compilation error' },
    ],
    answer: 'B',
    explanation:
      'The parameter int &x is a reference, so x refers to the original variable a. Assigning 10 inside change() updates a itself.',
  },
  {
    id: 'sql-having',
    topic: 'SQL',
    language: 'DBMS',
    question: 'Which SQL clause filters groups after GROUP BY?',
    code: '',
    options: [
      { key: 'A', text: 'WHERE' },
      { key: 'B', text: 'HAVING' },
      { key: 'C', text: 'ORDER BY' },
      { key: 'D', text: 'LIMIT' },
    ],
    answer: 'B',
    explanation:
      'WHERE filters rows before grouping. HAVING filters aggregated groups after GROUP BY, for example HAVING COUNT(*) > 5.',
  },
  {
    id: 'dsa-function-call-stack',
    topic: 'Data Structures',
    language: 'DSA',
    question: 'Which data structure manages function calls during recursion?',
    code: '',
    options: [
      { key: 'A', text: 'Queue' },
      { key: 'B', text: 'Stack' },
      { key: 'C', text: 'Linked list' },
      { key: 'D', text: 'Heap' },
    ],
    answer: 'B',
    explanation:
      'Each call is pushed onto the call stack and popped when it returns. Recursion depth is limited by the size of this stack.',
  },
  {
    id: 'java-array-length',
    topic: 'Arrays',
    language: 'Java',
    question: 'What will be printed?',
    code: `int[] arr = {1, 2, 3};
System.out.println(arr.length);`,
    options: [
      { key: 'A', text: '2' },
      { key: 'B', text: '3' },
      { key: 'C', text: '4' },
      { key: 'D', text: 'Compilation error' },
    ],
    answer: 'B',
    explanation:
      'Arrays in Java expose a read-only length field. This array holds three elements, so arr.length is 3.',
  },
  {
    id: 'python-string-length',
    topic: 'Strings',
    language: 'Python',
    question: 'What is the output of this code?',
    code: `print(len("YuvaHive"))`,
    options: [
      { key: 'A', text: '7' },
      { key: 'B', text: '8' },
      { key: 'C', text: '9' },
      { key: 'D', text: 'Error' },
    ],
    answer: 'B',
    explanation:
      'len() counts characters. "YuvaHive" has 8 characters: Y, u, v, a, H, i, v, e.',
  },
  {
    id: 'js-map-filter',
    topic: 'Array Methods',
    language: 'JavaScript',
    question: 'What is the output of this code?',
    code: `console.log([1, 2, 3].map(x => x * 2).filter(x => x > 2));`,
    options: [
      { key: 'A', text: '[2, 4, 6]' },
      { key: 'B', text: '[4, 6]' },
      { key: 'C', text: '[3]' },
      { key: 'D', text: '[1, 2, 3]' },
    ],
    answer: 'B',
    explanation:
      'map() first produces [2, 4, 6]. filter() then keeps values greater than 2, leaving [4, 6]. Both methods return new arrays.',
  },
  {
    id: 'web-idempotent-method',
    topic: 'HTTP',
    language: 'Web',
    question: 'Which HTTP method is idempotent?',
    code: '',
    options: [
      { key: 'A', text: 'POST' },
      { key: 'B', text: 'PATCH' },
      { key: 'C', text: 'GET' },
      { key: 'D', text: 'CONNECT' },
    ],
    answer: 'C',
    explanation:
      'An idempotent method can be repeated without changing the result beyond the first call. GET is safe and idempotent; POST is neither.',
  },
  {
    id: 'cpp-pointer-dereference',
    topic: 'Pointers',
    language: 'C++',
    question: 'What will be printed?',
    code: `int a = 5;
int *p = &a;
cout << *p;`,
    options: [
      { key: 'A', text: 'Address of a' },
      { key: 'B', text: '5' },
      { key: 'C', text: '0' },
      { key: 'D', text: 'Compilation error' },
    ],
    answer: 'B',
    explanation:
      'p stores the address of a. Dereferencing with *p gives the value stored at that address, which is 5.',
  },
  {
    id: 'python-floor-division',
    topic: 'Operators',
    language: 'Python',
    question: 'What is the output of this code?',
    code: `print(7 // 2, 7 % 2)`,
    options: [
      { key: 'A', text: '3 1' },
      { key: 'B', text: '3.5 1' },
      { key: 'C', text: '4 1' },
      { key: 'D', text: '3 0' },
    ],
    answer: 'A',
    explanation:
      '// is floor division and % is the remainder. 7 divided by 2 gives quotient 3 and remainder 1, so the output is 3 1.',
  },
];
