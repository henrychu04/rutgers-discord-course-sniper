import { GuardFunction } from '@typeit/discord';

export const isDM: GuardFunction<'message'> = async ([message], client, next) => {
  if (message.guild == null) {
    await next();
  }
};
