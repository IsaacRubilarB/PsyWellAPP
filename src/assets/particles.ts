//Fuegos artificales
export const fireworkParticlesConfig = {
    fpsLimit: 60,
    particles: {
      number: {
        value: 0,
      },
      color: {
        value: ['#FFD700', '#FF6347', '#FF4500'],
      },
      shape: {
        type: 'star',
      },
      opacity: {
        value: 1,
      },
      size: {
        value: { min: 5, max: 20 },
      },
      move: {
        speed: 10,
        enable: true,
      },
      lineLinked: {
        enable: false,
      },
    },
    interactivity: {
      events: {
        onClick: {
          enable: true,
          mode: 'push',
        },
        onHover: {
          enable: false,
        },
      },
      modes: {
        push: {
          quantity: 20,
        },
      },
    },
    detectRetina: true,
  };


  //Particulas suaves
  export const softParticlesConfig = {
    fpsLimit: 60,
    particles: {
      number: {
        value: 50,
      },
      color: {
        value: ['#FFFFFF', '#A9A9A9'],
      },
      shape: {
        type: 'circle',
      },
      opacity: {
        value: 0.5,
      },
      size: {
        value: { min: 3, max: 8 },
      },
      move: {
        speed: 2,
        enable: true,
      },
      lineLinked: {
        enable: false,
      },
    },
    interactivity: {
      events: {
        onHover: {
          enable: true,
          mode: 'repulse',
        },
      },
      modes: {
        repulse: {
          distance: 100,
          duration: 0.4,
        },
      },
    },
    detectRetina: true,
  };
  