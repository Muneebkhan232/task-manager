const mongoose = require('mongoose');
const Task = require('../models/Task');

const ALLOWED = ['title', 'description', 'status', 'dueDate'];
const pick = (body) =>
  Object.fromEntries(Object.entries(body || {}).filter(([k]) => ALLOWED.includes(k)));

const checkId = (id, res) => {
  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, message: 'Invalid task ID' });
    return false;
  }
  return true;
};

exports.createTask = async (req, res, next) => {
  try {
    const task = await Task.create(pick(req.body));
    res.status(201).json({ success: true, data: task });
  } catch (err) { next(err); }
};

exports.getTasks = async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (err) { next(err); }
};

exports.getTask = async (req, res, next) => {
  try {
    if (!checkId(req.params.id, res)) return;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (err) { next(err); }
};

exports.updateTask = async (req, res, next) => {
  try {
    if (!checkId(req.params.id, res)) return;
    const task = await Task.findByIdAndUpdate(req.params.id, pick(req.body), {
      new: true,
      runValidators: true,
    });
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, data: task });
  } catch (err) { next(err); }
};

exports.deleteTask = async (req, res, next) => {
  try {
    if (!checkId(req.params.id, res)) return;
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.status(200).json({ success: true, message: 'Task deleted successfully' });
  } catch (err) { next(err); }
};
