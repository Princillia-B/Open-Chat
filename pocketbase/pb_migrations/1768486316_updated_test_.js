/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_645381830")

  // update collection data
  unmarshal({
    "name": "O_Chat"
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_645381830")

  // update collection data
  unmarshal({
    "name": "test"
  }, collection)

  return app.save(collection)
})
