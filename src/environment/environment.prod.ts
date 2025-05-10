// environment.prod.ts (para producción en AWS)
export const environment = {
  production: true,
  apiUrl: 'http://ec2-3-137-214-164.us-east-2.compute.amazonaws.com:8080', // Backend en AWS
  websocketUrl: 'http://ec2-3-137-214-164.us-east-2.compute.amazonaws.com:8080/chat-websocket'
};

