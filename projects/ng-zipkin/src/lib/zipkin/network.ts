const networkInterfaces = () => {
  return null;
};

function pickInterface(interfaces, family) {
  for (const i in interfaces) {
    for (let j = interfaces[i].length - 1; j >= 0; j -= 1) {
      const face = interfaces[i][j];
      const reachable = family === 'IPv4' || face.scopeid === 0;
      if (!face.internal && face.family === family && reachable) {
        return face.address;
      }
    }
  }
  return family === 'IPv4' ? '127.0.0.1' : '::1';
}

function reduceInterfaces(interfaces, iface) {
  const ifaces = {};
  /*eslint-disable */
  for (const i in interfaces) {
    /* eslint-enable */
    if (i === iface) {
      ifaces[i] = interfaces[i];
    }
  }
  return ifaces;
}

function _ipv4(iface) {
  let interfaces = networkInterfaces();
  if (iface) {
    interfaces = reduceInterfaces(interfaces, iface);
  }
  return pickInterface(interfaces, 'IPv4');
}

function _ipv6(iface) {
  let interfaces = networkInterfaces();
  if (iface) {
    interfaces = reduceInterfaces(interfaces, iface);
  }
  return pickInterface(interfaces, 'IPv6');
}

export const network = {
  ipv4: _ipv4,
  ipv6: _ipv6
};

