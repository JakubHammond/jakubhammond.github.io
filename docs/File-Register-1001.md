# File Register 1001

This File register is desgined for my 1001 architecture and has dual read capabilities and you do need to write to each register first.
The way the File Register is designed is to write first, read next. Also there is a reset input to reset the register and located using the write address input. And 'we' input allows the Write Enable to a register.
This is the SystemVerilog code:
```systemverilog
`timescale 1ns/1ps

module RegisterFile #(
    parameter WIDTH = 8,
    parameter REGISTER_COUNT = 32
)(
    input  logic                       clk,
    input  logic                       reset,     // synchronous reset
    input  logic                       we,        // write enable
    input  logic [$clog2(REGISTER_COUNT)-1:0] waddr,
    input  logic [WIDTH-1:0]           wdata,
    input  logic [$clog2(REGISTER_COUNT)-1:0] raddr1,
    input  logic [$clog2(REGISTER_COUNT)-1:0] raddr2,
    output logic [WIDTH-1:0]           rdata1,
    output logic [WIDTH-1:0]           rdata2
);

    // Register array
    logic [WIDTH-1:0] regs [REGISTER_COUNT-1:0];

    // Synchronous write + reset
    always_ff @(posedge clk) begin
        if (reset) begin
            // Reset all registers
            integer i;
            for (i = 0; i < REGISTER_COUNT; i = i + 1)
                regs[i] <= '0;
        end else begin
            if (we && waddr != 0)
                regs[waddr] <= wdata;
            regs[0] <= '0; // x0 hardwired to zero
        end
    end

    // Combinational read ports (write-first)
    always_comb begin
        // Read port 1
        if (raddr1 == 0)
            rdata1 = '0;
        else if (we && waddr == raddr1 && waddr != 0)
            rdata1 = wdata;   // write-first behavior
        else
            rdata1 = regs[raddr1];

        // Read port 2
        if (raddr2 == 0)
            rdata2 = '0;
        else if (we && waddr == raddr2 && waddr != 0)
            rdata2 = wdata;   // write-first behavior
        else
            rdata2 = regs[raddr2];
    end

endmodule

```
This is the File Register Test bench:
```systemverilog
`timescale 1ns/1ps

module tb_RegisterFile;

    localparam WIDTH = 8;
    localparam REG_COUNT = 32;

    logic clk;
    logic reset;
    logic we;
    logic [$clog2(REG_COUNT)-1:0] waddr;
    logic [WIDTH-1:0] wdata;
    logic [$clog2(REG_COUNT)-1:0] raddr1, raddr2;
    logic [WIDTH-1:0] rdata1, rdata2;

    // DUT
    RegisterFile #(
        .WIDTH(WIDTH),
        .REGISTER_COUNT(REG_COUNT)
    ) dut (
        .clk(clk),
        .reset(reset),
        .we(we),
        .waddr(waddr),
        .wdata(wdata),
        .raddr1(raddr1),
        .raddr2(raddr2),
        .rdata1(rdata1),
        .rdata2(rdata2)
    );

    // Clock
    always #5 clk = ~clk;

    initial begin
        $display("Starting RegisterFile test...");
        clk = 0;
        reset = 1;
        we = 0;
        waddr = 0;
        wdata = 0;
        raddr1 = 0;
        raddr2 = 0;

        #10;
        reset = 0;

        // Test 1: x0 always zero
        we = 1; waddr = 0; wdata = 8'hFF;
        #10; we = 0; raddr1 = 0;
        #1;
        assert(rdata1 == 0) else $fatal("FAIL: Register 0 not zero");

        // Test 2: normal write/read
        #10;
        we = 1; waddr = 5; wdata = 8'hAA;
        #10; we = 0; raddr1 = 5;
        #1;
        assert(rdata1 == 8'hAA) else $fatal("FAIL: Write/read mismatch");

        // Test 3: write-first (same cycle read)
        #10;
        we = 1; waddr = 6; wdata = 8'h55; raddr1 = 6;
        #1;
        assert(rdata1 == 8'h55) else $fatal("FAIL: Write-first not working");

        // Test 4: reset clears registers
        #10;
        reset = 1;
        #10;
        reset = 0;
        raddr1 = 5;
        #1;
        assert(rdata1 == 0) else $fatal("FAIL: Reset did not clear register");

        $display("ALL TESTS PASSED ✔");
        #20;
        $finish;
    end

endmodule
```
Here is also the Sim_main.cpp for the actual simulation:
```systemverilog
#include "VRegisterFile.h"
#include "verilated.h"
#include <iostream>
#include <iomanip>

vluint64_t main_time = 0;
double sc_time_stamp() { return main_time; }

int main(int argc, char** argv) {
    Verilated::commandArgs(argc, argv);
    VRegisterFile* dut = new VRegisterFile;

    auto tick = [&]() {
        dut->clk = 0; dut->eval(); main_time++;
        dut->clk = 1; dut->eval(); main_time++;
    };

    // Initialize
    dut->we     = 0;
    dut->waddr  = 0;
    dut->wdata  = 0;
    dut->raddr1 = 0;
    dut->raddr2 = 0;

    std::cout << "Simulating RegisterFile for all 32 registers...\n";

    for (int reg = 1; reg < 32; ++reg) { // skip x0
        dut->we    = 1;
        dut->waddr = reg;
        dut->wdata = reg * 3;

        // write-first read test
        dut->raddr1 = reg;
        dut->raddr2 = 0;
        dut->eval();

        std::cout << "Writing x" << reg << " = " << std::setw(2) << (int)dut->wdata
                  << " | Same-cycle read: " << (int)dut->rdata1
                  << " | x0 = " << (int)dut->rdata2 << "\n";

        tick(); // next clock
        dut->we = 0;

        // Read all registers
        std::cout << "Register states: ";
        for (int i = 0; i < 32; ++i) {
            dut->raddr1 = i;
            dut->eval();
            std::cout << std::setw(2) << (int)dut->rdata1 << " ";
        }
        std::cout << "\n----------------------\n";
    }

    delete dut;
    return 0;
}
```
I did synthesize this using Sosys and here is the statiscs:
```output
4. Printing statistics.

=== RegisterFile ===

        +----------Local Count, excluding submodules.
        | 
      932 wires
     1189 wire bits
       41 public wires
      298 public wire bits
        9 ports
       42 port bits
     1163 cells
       49   $_ANDNOT_
        3   $_AND_
      512   $_MUX_
        2   $_NAND_
        1   $_NOR_
      233   $_NOT_
        4   $_ORNOT_
       93   $_OR_
      248   $_SDFFCE_PN0P_
        8   $_SDFF_PN0_
       10   $_XOR_
```
All else, there was no problems or issues during the synthesis and everything works perfectly as designed.
