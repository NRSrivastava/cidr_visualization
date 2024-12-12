export const numberToIpv4 = (num) => (
    [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255]
    .join('.'));

export const ipv4ToNumber = (ip) => ( ip.split('.').reduce(
    (acc,x,i) => (acc+(x<<8*(3-i))),
    0) >>>0 );