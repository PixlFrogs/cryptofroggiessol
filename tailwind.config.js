module.exports = {
  purge: [],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      keyframes :{
        cloud : {
          "0%":  { transform: 'translate(0%, 0%)' },
          "90%": { transform: 'translate(700%, 0%)' },
          "91%": { transform: 'translate(700%, -400%)'},
          "92%": { transform: 'translate(-800%, -400%)'},
          "94%": { transform: 'translate(-100%, 0%)'},
          "100%": { transform: 'translate(0%, 0%)'},
        }
      },
      animation: {
        cloud: "cloud 100s linear infinite",
        cloudslow: "cloud 90s linear infinite"
      }
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
