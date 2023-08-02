const Item = require("../models/itemSchema");
const Table = require("../models/tableSchema");
const Log = require("../models/logSchema");

exports.addItem = async (req, res) => {
  try {
    const { item } = req.body;
    const tableName = req.session.table;
    const table = await Table.findOne({ name: tableName });
    const existingItem = await Item.findOne({ ProductID: item.ProductID });
    if (existingItem) {
      return res.status(400).json({ message: "The item exists already" });
    }
    const newItem = new Item({
      ProductID: item.ProductID,
      ProductName: item.ProductName,
      Description: item.Description,
      BuyMake: item.BuyMake,
      Manufacturer: item.Manufacturer,
      ManufacturerID: item.ManufacturerID,
      Distrobutor: item.Distrobutor,
      Document: item.Document,
      TreeAvailable: item.TreeAvailable,
    });
    const logData = new Log({
      UID: req.session.user,
      action:
        "Item " + item.ProductID + " was added by " + req.session.user.email,
    });
    table.products.push(newItem);
    table.logs.push(logData);
    await table.save();
    await logData.save();
    await newItem.save();
    return res.status(200).json({ message: "Item added succsfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.addChild = async (req, res) => {
  try {
    tableName = req.body.tableName;
    pid = req.body.pid;
    const Father = await Item.findOne({ ProductID: pid });
    const Table = await Table.findOne({ name: tableName });
    if (!Father) {
      return res.status(404).json({
        message: "Item not found, please add an item that has the pid",
      });
    }
    const pids = req.body.pids;
    for (let i = 0; i < pids.length; i++) {
      const potentialChild = await Item.findOne({ ProductID: pids[i] });
      if (!potentialChild) {
        return res.status(404).json({
          message: "Item that has " + pids[i] + " pid, was not found",
        });
      }
      const logData = new Log({
        UID: req.session.user,
        action:
          "Item " +
          Father.ProductID +
          " receieve a new child " +
          pids[i] +
          ", by user " +
          req.session.user.email,
      });
      await logData.save();
      Father.Sons.push(potentialChild);
      potentialChild.Father = Father;
      await potentialChild.save();
    }
    Father.TreeAvailable = true;
    await Father.save();
    return res.status(200).json({ message: "Chidlren added succesfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.removeItem = async (req, res) => {
  try {
    const { pid } = req.body;
    const tableName = req.session.table;
    const table = Table.findOne({ name: tableName });
    const existingItem = await Item.findOneAndDelete({ ProductID: pid });
    if (!existingItem) {
      return res
        .status(400)
        .json({ message: "Item not found in the database" });
    }
    const logData = new Log({
      UID: req.session.user,
      action:
        "Item " +
        existingItem.ProductID +
        " was removed by " +
        req.session.user.email,
    });
    await logData.save();
    table.products.filter((id) => !id.equals(pid));
    await table.save();
    return res.status(200).json({ message: "Item deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.searchItem = async (req, res) => {
  try {
    const { pid } = req.body;
    const tableName = req.session.table;
    const table = await Table.findOne({ name: tableName }).populate("products");
    const findItem = await Item.findOne({ ProductID: pid });
    if (!findItem) {
      return res
        .status(400)
        .json({ message: "Item not found in the database" });
    }
    let products = table.products;
    for (let i = 0; i < products.length; i++) {
      if (products[i]._id.toString() === findItem._id.toString()) {
        return res.status(200).json(findItem);
      }
    }
    return res.status(400).json({ message: "Item not found in the database" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
