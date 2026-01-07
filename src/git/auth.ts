import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

export const getGitHubToken = (): string => {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.error('❌ GITHUB_TOKEN not set in environment');
    process.exit(1);
  }
  return token;
};
