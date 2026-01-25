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
