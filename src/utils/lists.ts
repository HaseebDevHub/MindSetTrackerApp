export const keyById = <T extends { id: string }>(item: T) => item.id;

export const keyByValue = (item: string | number) => String(item);

export const keyByName = <T extends { name: string }>(item: T) => item.name;

export const keyByTitle = <T extends { title: string }>(item: T) => item.title;
