import { GuardFunction } from '@typeit/discord';

export const admin: GuardFunction<'message'> = async ([message], client, next) => {
  if (message.member) {
    if (message.member.roles.cache.some((r) => r.name === 'Mod')) {
      await next();
    }
  }
};
