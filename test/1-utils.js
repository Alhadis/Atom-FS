"use strict";

const fs       = require("fs");
const {expect} = require("chai");
const utils    = require("../lib/utils.js");


describe("Utility functions", () => {
	describe("statify()", () => {
		const {statify} = utils;
		const plainStats = {
			dev: 16777220,
			mode: 33188,
			nlink: 1,
			uid: 501,
			gid: 20,
			rdev: 0,
			blksize: 4096,
			ino: 175025642,
			size: 1104,
			blocks: 8,
			atime: 1481195566000,
			mtime: 1481195249000,
			ctime: 1481195249000,
			birthtime: 1481192516000
		};

		it("converts plain objects into fs.Stats instances", () => {
			const obj = statify(plainStats);
			expect(obj.constructor).to.equal(fs.Stats);
		});

		it("leaves actual fs.Stats instances untouched", () => {
			const realStats = Object.freeze(fs.lstatSync(__filename));
			const statified = statify(realStats);
			expect(realStats).to.equal(statified);
		});

		it("retains accurate timestamps", () => {
			const obj = statify(plainStats);
			expect(obj.atime).to.be.a("date");
			expect(obj.mtime).to.be.a("date");
			expect(obj.ctime).to.be.a("date");
			expect(obj.birthtime).to.be.a("date");
			expect(obj.atime.getTime()).to.equal(1481195566000);
			expect(obj.mtime.getTime()).to.equal(1481195249000);
			expect(obj.ctime.getTime()).to.equal(1481195249000);
			expect(obj.ctime.getTime()).not.to.equal(1481195249001);
			expect(obj.birthtime.getTime()).to.equal(1481192516000);
		});

		it("retains accurate mode-checking methods", () => {
			const modeChecks = {
				isBlockDevice:     0b0110000110100000,
				isCharacterDevice: 0b0010000110110110,
				isDirectory:       0b0100000111101101,
				isFIFO:            0b0001000110100100,
				isFile:            0b1000000111101101,
				isSocket:          0b1100000111101101,
				isSymbolicLink:    0b1010000111101101
			};

			for(const methodName in modeChecks){
				const mode = modeChecks[methodName];
				const stat = statify(Object.assign({}, plainStats, {mode}));
				expect(stat.mode, methodName).to.equal(mode);
				expect(stat[methodName], methodName).to.be.a("function");
				expect(stat[methodName](), `${methodName}(${mode})`).to.be.a("boolean");
			}
		});
	});

	describe("sipFile()", () => {
		const {sipFile} = utils;
		const path = require("path");

		it("reads partial data from the filesystem", () => {
			const [dataSample] = sipFile(__filename, 10);
			expect(dataSample).to.equal('"use stric');
		});

		it("indicates if a file was fully-loaded", () => {
			const results = sipFile(__filename, 1);
			expect(results).to.be.an("array");
			expect(results).to.have.lengthOf(2);
			expect(results[1]).to.be.false;
		});

		it("allows reading from an arbitrary offset", () => {
			const [dataSample] = sipFile(__filename, 10, 1);
			expect(dataSample).to.equal("use strict");
		});

		it("trims extra bytes if content is shorter than sample limit", () => {
			const imagePath = path.resolve(__dirname, "fixtures/image.gif");
			const [dataSample] = sipFile(imagePath, 100);
			expect(dataSample).to.have.lengthOf(42);
		});
	});
});
