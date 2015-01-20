resolve(X):

  p = project level of x
  i = index.js of x

  Merge them:

  p = p.defaults(i)
  p.__dirname = meta.localModules/X
  p.__name = x
  resolveExtend(p)
  return p

resolveExtend(p):
  if (p.extend) {
    if (p.extend is a string) {
      p.extend = ourRequire(p.extend)
    }
  } else {
    p.extend = npmRequire(our name) or npmRequire(meta.defaultClass)
    p.__name = 'my-' + p.__name;
  }

ourRequire(name):
  m = require from project or npm
  resolveExtend(m)

npmRequire(name):
  var path = require.resolve(name)
  var dir = dirname(path)
  m = require(path)
  m.__dirname = dir
  m.__name = basename(dir)
  return m

projectRequire(name):
  if folder exists (meta.localModules/X)
    if file exists meta.localModules/X/index.js
      return npmRequire(meta.localModules/X/index.js)
    else
      return {
        // So we can do overrides of templates and push browser
        // side code, even if we have no index.js
        __dirname: meta.localModules/X
        name: name
      }
  return null

instantiate(x, options):
  d = resolve(x)
  var that = {}
  var next = d

  options._directories = options._directories || []
  while next
    options._directories.push({ dirname: d.__dirname, name: d.__name })
    next = next.extend

  next = d

  // options are set deepest subclass first
  while next
    for (all properties that are not beforeConstruct or construct)
      apply as defaults to 'options' object
    if next.beforeConstruct
      next.beforeConstruct(o, options)
    next = next.extend

  construct(d, o, options)

  // Now in reverse order: base class first
  construct(d, o, options):
    if (d.extend)
      construct(d.extend, o, options)
    if d.construct
      d.construct(o, options)
