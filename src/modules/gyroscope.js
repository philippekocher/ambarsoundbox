
// export const gyroscope = {
//   eventHandler: null,
//   listeners: {},
//   isRunning: false,
//   start: async (e) => {
//     if(gyroscope.isRunning) return;
//     
//     if(!window.DeviceOrientationEvent) {
//       alert('Dein Gerät unterstützt kein Gyroscope')
//       return
//     }  
//                 
//     // iOS 13+ permission request
//     if(typeof DeviceOrientationEvent.requestPermission === 'function') {
//     DeviceOrientationEvent.requestPermission()
//         .then(response => {
//             if(response === 'granted') {
//                 // Access is granted; you can start using device orientation
//             }
//         })
//         .catch(error => {
//             console.error("Permission denied:", error)
//             alert(error)
//         })
//     }
//     
//     // event handler
//     gyroscope.eventHandler = (event) => {
//       const alpha = event.alpha ?? '0.00'
//       const beta = event.beta ?? '0.00'
//       const gamma = event.gamma ?? '0.00'
//       
//       gyroscope.listeners.start.setAttribute('value', 1)
//       gyroscope.isRunning = true;
// 
//       if(gyroscope.listeners.x) gyroscope.listeners.x.setAttribute('value', alpha)
//       if(gyroscope.listeners.y) gyroscope.listeners.y.setAttribute('value', beta)
//       if(gyroscope.listeners.z) gyroscope.listeners.z.setAttribute('value', gamma)
//     }
//     
//     window.addEventListener('deviceorientation', gyroscope.eventHandler)
//   },
//   
//   stop: function() {
//     if (gyroscope.eventHandler) {
//       window.removeEventListener('deviceorientation', gyroscope.eventHandler);
//       gyroscope.eventHandler = null;
//       gyroscope.isRunning = false;
//       gyroscope.listeners.start.setAttribute('value', 0)
//     }
//   }
// }