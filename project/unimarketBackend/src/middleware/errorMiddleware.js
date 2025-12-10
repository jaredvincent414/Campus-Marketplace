const notFound = (req, res) => {
    res.status(404).json({ message: "Not Found" });
};

const errorHandler = (err, req, res, next) => {
    const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    res.status(status).json({ message: err.message || "Server error" });
};

module.exports = { notFound, errorHandler };

