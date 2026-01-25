# File Register 1002

This is the 2nd version of the File Register 1001. This is designed simpler and is more clean and safe.

This is the SystemVerilog code for File-Register-1002.sv:

```systemverilog
`timescale 1ns/1ps

module RegisterFile #(
    parameter WIDTH = 8,
    parameter REGISTER_COUNT = 8
)(
    input  logic clk,
    input  logic reset,
    input  logic we,
    input  logic [$clog2(REGISTER_COUNT)-1:0] waddr,
    input  logic [WIDTH-1:0] wdata,
    input  logic [$clog2(REGISTER_COUNT)-1:0] raddr,
    output logic [WIDTH-1:0] rdata
);

    logic [WIDTH-1:0] regs [REGISTER_COUNT-1:0];

    always_ff @(posedge clk) begin
        if (reset) begin
            integer i;
            for (i = 0; i < REGISTER_COUNT; i = i + 1)
                regs[i] <= '0;
        end else begin
            if (we && waddr != 0)
                regs[waddr] <= wdata;
            regs[0] <= '0;
        end
    end

    always_comb begin
        if (raddr == 0)
            rdata = '0;
        else
            rdata = regs[raddr];
    end

endmodule
```
---
## Write Logic
The Boolean Equations used for writing logic for reset is:
```code
Rj[k] = 0  if reset == 1
```
For write logic, I used this equation:
```Boolean
Rj[k] = (we AND (waddr == j) AND ~reset) ? wdata[k] : Rj[k]
```
Note: R0[k] is always zero, so for j = 0:
```code
R0[k] = 0
```
For all other registers: (j = 1...7):
```code
Rj[k] = (reset) ? 0 : ((we AND (waddr == j)) ? wdata[k] : Rj[k])
```
So we can use R1[0] as an example for a single bit register:
```code
R1[0]_next = (reset) ? 0 : ((we AND (waddr[2:0] == 3'b001)) ? wdata[0] : R1[0]_current)
```
waddr[2:0] == 3'b001 can be expanded as:
```code
(~waddr[2] AND ~waddr[1] AND waddr[0])
```
So the fully expanded Boolean:
```Boolean
R1[0]_next = reset' * (we * (~waddr[2] * ~waddr[1] * waddr[0]) * wdata[0] + R1[0]_current)
R1[0]_next = reset ? 0 : (we AND ~waddr[2] AND ~waddr[1] AND waddr[0] ? wdata[0] : R1[0]_current)
```
---
## Read Logic
So we have a single read port raddr and output rdata[7:0]. The combinational logic:
```code
rdata[k] = (raddr == 0) ? 0 :
           (raddr == 1) ? R1[k] :
           (raddr == 2) ? R2[k] :
           ...
           (raddr == 7) ? R7[k]
```
Expanded into Boolean form for rdata[0]:
```Boolean
rdata[0] = (~raddr[2] & ~raddr[1] & ~raddr[0] ? 0 : 0) + 
           (~raddr[2] & ~raddr[1] & raddr[0] ? R1[0] : 0) + 
           (~raddr[2] & raddr[1] & ~raddr[0] ? R2[0] : 0) + 
           (~raddr[2] & raddr[1] & raddr[0] ? R3[0] : 0) + 
           (raddr[2] & ~raddr[1] & ~raddr[0] ? R4[0] : 0) + 
           (raddr[2] & ~raddr[1] & raddr[0] ? R5[0] : 0) + 
           (raddr[2] & raddr[1] & ~raddr[0] ? R6[0] : 0) + 
           (raddr[2] & raddr[1] & raddr[0] ? R7[0] : 0)
```
---
## General Formula
For bit k of register j:
```code
Rj[k]_next = reset ? 0 : ((j != 0 AND we AND waddr == j) ? wdata[k] : Rj[k]_current)
```
For read output bit k:
```code
rdata[k] = OR over j=0..7 of ((raddr == j) ? Rj[k] : 0)
```
---
The testbench code used to test the SystemVerilog code used:
```systemverilog
`timescale 1ns/1ps

module tb_RegisterFile;

    // Parameters
    localparam WIDTH = 8;
    localparam REG_COUNT = 8;

    // Signals
    logic clk;
    logic reset;
    logic we;
    logic [$clog2(REG_COUNT)-1:0] waddr;
    logic [WIDTH-1:0] wdata;
    logic [$clog2(REG_COUNT)-1:0] raddr;
    logic [WIDTH-1:0] rdata;

    // Instantiate the RegisterFile
    RegisterFile #(
        .WIDTH(WIDTH),
        .REGISTER_COUNT(REG_COUNT)
    ) rf (
        .clk(clk),
        .reset(reset),
        .we(we),
        .waddr(waddr),
        .wdata(wdata),
        .raddr(raddr),
        .rdata(rdata)
    );

    // Clock generation
    initial clk = 0;
    always #5 clk = ~clk;  // 10ns period

    // Test sequence
    initial begin
        // Initialize signals
        reset = 1;
        we = 0;
        waddr = 0;
        raddr = 0;
        wdata = 0;

        // Apply reset
        #10;
        reset = 0;

        // Test writing to registers
        // Write 8'hAA to R1
        we = 1;
        waddr = 1;
        wdata = 8'hAA;
        #10;  // wait one clock cycle

        // Write 8'h55 to R2
        waddr = 2;
        wdata = 8'h55;
        #10;

        // Disable write
        we = 0;

        // Read from registers
        raddr = 0; #5;  // should read 0
        $display("R0 = %h (expected 00)", rdata);

        raddr = 1; #5;  // should read 8'hAA
        $display("R1 = %h (expected AA)", rdata);

        raddr = 2; #5;  // should read 8'h55
        $display("R2 = %h (expected 55)", rdata);

        raddr = 3; #5;  // should read 0
        $display("R3 = %h (expected 00)", rdata);

        $finish;
    end

endmodule
```
This should be able to write and read from the registers.
---
## C++ Simulation
Here is the sim_main.cpp code that runs the simulation:
```cpp
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
    dut->raddr  = 0;
    dut->reset  = 1;

    tick();
    dut->reset = 0;

    std::cout << "Simulating Registers\n";

    for (int reg = 1; reg < 8; ++reg) { // skip x0
        dut->we    = 1;
        dut->waddr = reg;
        dut->wdata = reg * 3; // test

        // same-cycle read
        dut->raddr = reg;
        dut->eval();
        std::cout << "Writing x" << reg << " = " << std::setw(2) << (int)dut->wdata
                  << " | Same-cycle read: " << (int)dut->rdata << "\n";

        tick(); // next cycle
        dut->we = 0;

        // Read all registers
        std::cout << "Register states: ";
        for (int i = 0; i < 8; ++i) {
            dut->raddr = i;
            dut->eval();
            std::cout << std::setw(2) << (int)dut->rdata << " ";
        }
        std::cout << "\n----------------------\n";
    }

    delete dut;
    return 0;
}
```
It should run a pattern of writes that should look something like this:
```output
Simulating Registers
Writing x1 =  3 | Same-cycle read: 0
Register states:  0  3  0  0  0  0  0  0 
----------------------
Writing x2 =  6 | Same-cycle read: 0
Register states:  0  3  6  0  0  0  0  0 
----------------------
Writing x3 =  9 | Same-cycle read: 0
Register states:  0  3  6  9  0  0  0  0 
----------------------
Writing x4 = 12 | Same-cycle read: 0
Register states:  0  3  6  9 12  0  0  0 
----------------------
Writing x5 = 15 | Same-cycle read: 0
Register states:  0  3  6  9 12 15  0  0 
----------------------
Writing x6 = 18 | Same-cycle read: 0
Register states:  0  3  6  9 12 15 18  0 
----------------------
Writing x7 = 21 | Same-cycle read: 0
Register states:  0  3  6  9 12 15 18 21 
----------------------
```
This is an expected output for this code and simulation. Which is clean and safe.
I ran the code from my project file with 
```terminal
 verilator -Wall --cc RegisterFile.sv --exe sim_main.cpp
```
first to use verilator to build the obj_dir folder. Next I used:
```terminal
make -C obj_dir -j -f VRegisterFile.mk VRegisterFile
```
to make the simulation. Next I used:
```terminal
./obj_dir/VRegisterFile
```
to run the simulation.
