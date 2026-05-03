// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

interface IWorkshopToken {
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function owner() external view returns (address);
    function paused() external view returns (bool);
}

interface IWorkshopFeatures {
    function mint(address to, uint256 amount) external;
    function pause() external;
    function unpause() external;
    function freeze(address user, uint256 amount) external;
}

contract WorkshopSolver is Ownable {
    string private constant EXPECTED_NAME = "Wakanda";
    string private constant EXPECTED_SYMBOL = "WAKA";
    uint256 private constant OWNER_MIN = 1_000_000;
    address private constant ADDR_A = 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045;
    uint256 private constant ADDR_A_MIN = 10_000;
    address private constant ADDR_B = 0x3327873dc0474C3b8b784FDf89719bdC6d39eaFa;
    uint256 private constant ADDR_B_MIN = 50_000;
    uint256 private constant ADDR_B_MAX = 100_000;

    mapping(address => bool) public passed;
    mapping(address => address) public submittedToken;
    mapping(address => address) public tokenClaimedBy;
    address[] private _passedList;
    mapping(address => uint256) private _passedIndexPlus1;

    event WorkshopPassed(address indexed student, address indexed token);
    event StudentReset(address indexed student);

    error AlreadyPassed();
    error VerificationFailed(string reason);
    error NotAContract(address inputAddress);
    error TokenAlreadyClaimed(address token, address claimedBy);

    constructor(address initialOwner) Ownable(initialOwner) {}

    function runCheck(address token) external view returns (string memory) {
        if (token.code.length == 0) {
            return "ERROR: the address you entered is not a smart contract (no code deployed at this address). Please provide the address of your deployed Wakanda (WAKA) token contract.";
        }

        (bool[9] memory results, string[9] memory details) = _runChecks(token);

        string memory report = "";
        uint8 passCount = 0;
        for (uint8 i = 0; i < 9; i++) {
            report = string.concat(report, details[i], "\n");
            if (results[i]) passCount++;
        }
        report = string.concat(
            report,
            "Result: ",
            Strings.toString(passCount),
            "/9 - ",
            passCount == 9 ? "PASSED" : "NOT PASSED"
        );
        return report;
    }

    function submit(address token) external {
        if (passed[msg.sender]) revert AlreadyPassed();
        if (token.code.length == 0) revert NotAContract(token);

        address claimer = tokenClaimedBy[token];
        if (claimer != address(0)) {
            revert TokenAlreadyClaimed(token, claimer);
        }

        (bool[9] memory results, string[9] memory details) = _runChecks(token);
        for (uint8 i = 0; i < 9; i++) {
            if (!results[i]) revert VerificationFailed(details[i]);
        }

        passed[msg.sender] = true;
        submittedToken[msg.sender] = token;
        tokenClaimedBy[token] = msg.sender;
        _passedList.push(msg.sender);
        _passedIndexPlus1[msg.sender] = _passedList.length;
        emit WorkshopPassed(msg.sender, token);
    }

    function resetStudent(address student) external onlyOwner {
        address tok = submittedToken[student];
        if (tok != address(0) && tokenClaimedBy[tok] == student) {
            tokenClaimedBy[tok] = address(0);
        }

        uint256 idxPlus1 = _passedIndexPlus1[student];
        if (idxPlus1 != 0) {
            uint256 idx = idxPlus1 - 1;
            uint256 last = _passedList.length - 1;
            if (idx != last) {
                address moved = _passedList[last];
                _passedList[idx] = moved;
                _passedIndexPlus1[moved] = idx + 1;
            }
            _passedList.pop();
            _passedIndexPlus1[student] = 0;
        }
        passed[student] = false;
        submittedToken[student] = address(0);
        emit StudentReset(student);
    }

    function getPassedStudents() external view returns (address[] memory) {
        return _passedList;
    }

    function passedCount() external view returns (uint256) {
        return _passedList.length;
    }

    function _runChecks(address token)
        internal
        view
        returns (bool[9] memory results, string[9] memory details)
    {
        uint8 dec = _safeDecimals(token);
        uint256 unit = 10 ** dec;

        (results[0], details[0]) = _checkName(token);
        (results[1], details[1]) = _checkSymbol(token);
        (results[2], details[2]) = _checkOwnerBalance(token, unit, dec);
        (results[3], details[3]) = _checkAddrA(token, unit, dec);
        (results[4], details[4]) = _checkAddrB(token, unit, dec);
        (results[5], details[5]) = _checkMint(token);
        (results[6], details[6]) = _checkPause(token);
        (results[7], details[7]) = _checkFreeze(token);
        (results[8], details[8]) = _checkIsPaused(token);
    }

    function _checkName(address token) private view returns (bool ok, string memory msg_) {
        (string memory n, bool nOk) = _safeName(token);
        ok = nOk && _strEq(n, EXPECTED_NAME);
        msg_ = string.concat(
            "Step 1 (name = \"Wakanda\"): ",
            ok ? "OK" : string.concat("WRONG (got \"", nOk ? n : "<no name()>", "\")")
        );
    }

    function _checkSymbol(address token) private view returns (bool ok, string memory msg_) {
        (string memory s, bool sOk) = _safeSymbol(token);
        ok = sOk && _strEq(s, EXPECTED_SYMBOL);
        msg_ = string.concat(
            "Step 2 (symbol = \"WAKA\"): ",
            ok ? "OK" : string.concat("WRONG (got \"", sOk ? s : "<no symbol()>", "\")")
        );
    }

    function _checkOwnerBalance(address token, uint256 unit, uint8 dec)
        private
        view
        returns (bool ok, string memory msg_)
    {
        (address ownerAddr, bool oOk) = _safeOwner(token);
        uint256 bal = oOk ? _safeBalance(token, ownerAddr) : 0;
        ok = oOk && bal >= OWNER_MIN * unit;
        msg_ = string.concat(
            "Step 3 (owner() balance >= 1,000,000): ",
            ok
                ? "OK"
                : oOk
                    ? string.concat("WRONG (got ", _formatTokens(bal, dec), ")")
                    : "WRONG (no owner() function)"
        );
    }

    function _checkAddrA(address token, uint256 unit, uint8 dec)
        private
        view
        returns (bool ok, string memory msg_)
    {
        uint256 bal = _safeBalance(token, ADDR_A);
        ok = bal >= ADDR_A_MIN * unit;
        msg_ = string.concat(
            "Step 4 (0xd8dA...6045 >= 10,000): ",
            ok ? "OK" : string.concat("WRONG (got ", _formatTokens(bal, dec), ")")
        );
    }

    function _checkAddrB(address token, uint256 unit, uint8 dec)
        private
        view
        returns (bool ok, string memory msg_)
    {
        uint256 bal = _safeBalance(token, ADDR_B);
        ok = bal >= ADDR_B_MIN * unit && bal <= ADDR_B_MAX * unit;
        msg_ = string.concat(
            "Step 5 (0x3327...eaFa in [50,000..100,000]): ",
            ok ? "OK" : string.concat("WRONG (got ", _formatTokens(bal, dec), ")")
        );
    }

    function _checkMint(address token) private view returns (bool ok, string memory msg_) {
        ok = _hasFunction(
            token,
            abi.encodeWithSelector(IWorkshopFeatures.mint.selector, address(0), uint256(0))
        );
        msg_ = string.concat(
            "Step 6 (mint(address,uint256) exists): ",
            ok ? "OK" : "WRONG (mint not found)"
        );
    }

    function _checkPause(address token) private view returns (bool ok, string memory msg_) {
        bool hasPause = _hasFunction(
            token,
            abi.encodeWithSelector(IWorkshopFeatures.pause.selector)
        );
        bool hasUnpause = _hasFunction(
            token,
            abi.encodeWithSelector(IWorkshopFeatures.unpause.selector)
        );
        ok = hasPause && hasUnpause;
        msg_ = string.concat(
            "Step 7 (pause()/unpause() exist): ",
            ok
                ? "OK"
                : string.concat(
                    "WRONG (",
                    hasPause ? "" : "pause missing ",
                    hasUnpause ? "" : "unpause missing",
                    ")"
                )
        );
    }

    function _checkFreeze(address token) private view returns (bool ok, string memory msg_) {
        ok = _hasFunction(
            token,
            abi.encodeWithSelector(IWorkshopFeatures.freeze.selector, address(0), uint256(0))
        );
        msg_ = string.concat(
            "Step 8 (freeze(address,uint256) exists): ",
            ok ? "OK" : "WRONG (freeze not found)"
        );
    }

    function _checkIsPaused(address token) private view returns (bool ok, string memory msg_) {
        (bool isPaused, bool callOk) = _safePaused(token);
        ok = callOk && isPaused;
        msg_ = string.concat(
            "Step 9 (token is currently paused): ",
            ok
                ? "OK"
                : callOk
                    ? "WRONG (token is not paused - call pause() before submitting)"
                    : "WRONG (no paused() function)"
        );
    }

    // Each helper guards on token.code.length first: Solidity's high-level call
    // inserts an extcodesize check that reverts BEFORE the call when the target
    // has no code, and that pre-call revert is not caught by try/catch.
    function _safeName(address token) private view returns (string memory, bool) {
        if (token.code.length == 0) return ("", false);
        try IWorkshopToken(token).name() returns (string memory n) {
            return (n, true);
        } catch {
            return ("", false);
        }
    }

    function _safeSymbol(address token) private view returns (string memory, bool) {
        if (token.code.length == 0) return ("", false);
        try IWorkshopToken(token).symbol() returns (string memory s) {
            return (s, true);
        } catch {
            return ("", false);
        }
    }

    function _safeDecimals(address token) private view returns (uint8) {
        if (token.code.length == 0) return 18;
        try IWorkshopToken(token).decimals() returns (uint8 d) {
            return d;
        } catch {
            return 18;
        }
    }

    function _safeOwner(address token) private view returns (address, bool) {
        if (token.code.length == 0) return (address(0), false);
        try IWorkshopToken(token).owner() returns (address o) {
            return (o, true);
        } catch {
            return (address(0), false);
        }
    }

    function _safeBalance(address token, address account) private view returns (uint256) {
        if (token.code.length == 0) return 0;
        try IWorkshopToken(token).balanceOf(account) returns (uint256 b) {
            return b;
        } catch {
            return 0;
        }
    }

    function _safePaused(address token) private view returns (bool isPaused, bool callOk) {
        if (token.code.length == 0) return (false, false);
        try IWorkshopToken(token).paused() returns (bool p) {
            return (p, true);
        } catch {
            return (false, false);
        }
    }

    // A function "exists" if a staticcall to it reverts with non-empty data
    // (e.g. an onlyOwner custom error). A non-existent selector with no fallback
    // reverts with empty data. Matches the ThaiBaht4 / OpenZeppelin pattern where
    // mint/pause/unpause/freeze are all guarded by onlyOwner.
    function _hasFunction(address token, bytes memory data) private view returns (bool) {
        if (token.code.length == 0) return false;
        (bool success, bytes memory ret) = token.staticcall(data);
        return !success && ret.length > 0;
    }

    function _strEq(string memory a, string memory b) private pure returns (bool) {
        return keccak256(bytes(a)) == keccak256(bytes(b));
    }

    function _formatTokens(uint256 amount, uint8 dec) private pure returns (string memory) {
        uint256 unit = 10 ** dec;
        return string.concat(Strings.toString(amount / unit), " tokens");
    }
}
