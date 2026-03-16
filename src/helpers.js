export const numberToIpv4 = (num) => (num > 4294967295 ? '' :
    [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255]
    .join('.'));

export const ipv4ToNumber = (ip) => (ip.split('.').reduce(
    (acc, x, i) => (acc + (x << 8 * (3 - i))),
    0) >>> 0);

export const getCidrInfo = (cidr) => {
  const [ip, prefixStr] = cidr.split('/');
  const prefix = parseInt(prefixStr);
  const hostBits = 32 - prefix;
  const totalIPs = Math.pow(2, hostBits);

  // Build mask: prefix=0 means all zeros, otherwise shift ~0 left by hostBits
  const maskNum = prefix === 0 ? 0 : ((~0 << hostBits) >>> 0);
  const ipNum = ipv4ToNumber(ip);
  const networkNum = (ipNum & maskNum) >>> 0;
  const wildcardNum = (~maskNum) >>> 0;
  const broadcastNum = (networkNum | wildcardNum) >>> 0;

  // /31 and /32 have no traditional host range concept
  const usableHosts = prefix >= 31 ? totalIPs : Math.max(0, totalIPs - 2);
  const firstHostNum = prefix < 31 ? networkNum + 1 : networkNum;
  const lastHostNum = prefix < 31 ? broadcastNum - 1 : broadcastNum;

  return {
    cidr,
    prefix,
    network: numberToIpv4(networkNum),
    networkNum,
    broadcast: numberToIpv4(broadcastNum),
    broadcastNum,
    subnetMask: numberToIpv4(maskNum),
    wildcard: numberToIpv4(wildcardNum),
    firstHost: numberToIpv4(firstHostNum),
    lastHost: numberToIpv4(lastHostNum),
    totalIPs,
    usableHosts,
  };
};
