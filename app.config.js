import 'dotenv/config';
import appJson from './app.json';

export default {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      ...(appJson.expo?.extra || {}),
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    },
  },
};
