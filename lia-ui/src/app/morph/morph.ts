import anime from 'animejs';


export function morph() {
  var square = anime({
    targets: '.circle',
    duration: 300,
    width: {
      value: '300px',
      easing: 'easeInOutQuart'
    },
    height: {
      value: '500px',
      easing: 'easeInOutQuart'
    },
    borderRadius: '0%',
  })
  var promise = square.finished.then(function(res) {
    console.log('Morph Complete');
  });
}

export function unmorph() {
  var square = anime({
    targets: '.circle',
    duration: 300,
    width: {
      value: '48px',
      easing: 'easeInQuart'
    },
    height: {
      value: '48px',
      easing: 'easeInQuart'
    }
  })
  var promise = square.finished.then(function() {
    var square = anime({
      targets: '.circle',
      duration: 100,
      borderRadius: '100%',
      easing: 'linear'
    })
  })
}
