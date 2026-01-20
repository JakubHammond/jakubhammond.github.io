# Counter 1001

This counter is designed for the CPU project 1001 which uses scalable parameters that can scale the design.
The inputs, clk (clock) input will allow the counter to tick. The reset will reset the counter using synchronous reset. And Enable input, allowing the counter to increment by 1. And Load input, allowing the counter to jump to a intitial point. Load_val input is the input load that gives the number the counter can jump to. Count output is the output of the counter.

This is the systemverilog code of the module:

```systemverilog
`timescale 1ns/1ps

module counter #(
    parameter WIDTH = 8
)(
    input  logic             clk,
    input  logic             reset,   // synchronous reset
    input  logic             enable,  // increment when 1
    input  logic             load,
    input  logic [WIDTH-1:0] load_val,
    output logic [WIDTH-1:0] count
);

    always_ff @(posedge clk) begin
        if (reset) begin
            count <= '0;
        end else if (load) begin
            count <= load_val;
        end else if (enable) begin
            count <= count + 1'b1;
        end
    end

endmodule

```
This code has been tested with this testbench:
```systemverilog
`timescale 1ns/1ps

module counter_tb;

    parameter WIDTH = 8;

    logic clk;
    logic reset;
    logic enable;
    logic load;
    logic [WIDTH-1:0] load_val;
    logic [WIDTH-1:0] count;

    counter #(.WIDTH(WIDTH)) dut (
        .clk(clk),
        .reset(reset),
        .enable(enable),
        .load(load),
        .load_val(load_val),
        .count(count)
    );

    // Clock: 100 MHz
    always #5 clk = ~clk;

    initial begin
        clk = 0;
        reset = 1;
        enable = 0;
        load = 0;
        load_val = 0;

        #10 reset = 0;

        // Count up
        enable = 1;
        #50;

        // Load a value (simulate jump)
        load = 1;
        load_val = 8'h20;
        #10;
        load = 0;

        // Continue counting
        #40;

        $finish;
    end

endmodule
```
This is the testbench code, and this is the C++ Simulation for the actual test:
```cpp
#include "Vcounter.h"
#include "verilated.h"

int main(int argc, char **argv, char **env) {
    Verilated::commandArgs(argc, argv);
    Vcounter* top = new Vcounter;

    // Simulation variables
    int ticks = 100;   // number of clock cycles to simulate
    bool clk = 0;

    // Reset first
    top->reset = 1;
    top->clk = 0;
    top->enable = 0;
    top->load = 0;
    top->load_val = 0;

    top->eval();
    top->reset = 0;

    for (int t = 0; t < ticks; t++) {
        // Toggle clock
        clk = !clk;
        top->clk = clk;

        // Example control: enable counting after 2 cycles
        if (t > 2) top->enable = 1;

        // Example load at cycle 50
        if (t == 50) {
            top->load = 1;
            top->load_val = 42;  // load arbitrary value
        } else {
            top->load = 0;
        }

        // Evaluate the design
        top->eval();

        // Print output on rising edge
        if (clk) {
            printf("Cycle %d: count=%d\n", t/2, top->count);
        }
    }

    delete top;
    return 0;
}
```
the expected output for synthesis is:
```output
2. Executing SYNTH pass.

2.1. Executing HIERARCHY pass (managing design hierarchy).

2.1.1. Analyzing design hierarchy..
Top module:  \counter

2.1.2. Analyzing design hierarchy..
Top module:  \counter
Removed 0 unused modules.

2.2. Executing PROC pass (convert processes to netlists).

2.2.1. Executing PROC_CLEAN pass (remove empty switches from decision trees).
Cleaned up 0 empty switches.

2.2.2. Executing PROC_RMDEAD pass (remove dead branches from decision trees).
Marked 2 switch rules as full_case in process $proc$counter.sv:14$1 in module counter.
Removed a total of 0 dead cases.

2.2.3. Executing PROC_PRUNE pass (remove redundant assignments in processes).
Removed 0 redundant assignments.
Promoted 0 assignments to connections.

2.2.4. Executing PROC_INIT pass (extract init attributes).

2.2.5. Executing PROC_ARST pass (detect async resets in processes).

2.2.6. Executing PROC_ROM pass (convert switches to ROMs).
Converted 0 switches.
<suppressed ~3 debug messages>

2.2.7. Executing PROC_MUX pass (convert decision trees to multiplexers).
Creating decoders for process `\counter.$proc$counter.sv:14$1'.
     1/1: $0\count[7:0]

2.2.8. Executing PROC_DLATCH pass (convert process syncs to latches).

2.2.9. Executing PROC_DFF pass (convert process syncs to FFs).
Creating register for signal `\counter.\count' using process `\counter.$proc$counter.sv:14$1'.
  created $dff cell `$procdff$11' with positive edge clock.

2.2.10. Executing PROC_MEMWR pass (convert process memory writes to cells).

2.2.11. Executing PROC_CLEAN pass (remove empty switches from decision trees).
Found and cleaned up 3 empty switches in `\counter.$proc$counter.sv:14$1'.
Removing empty process `counter.$proc$counter.sv:14$1'.
Cleaned up 3 empty switches.

2.2.12. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.3. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.4. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..
Removed 0 unused cells and 4 unused wires.
<suppressed ~1 debug messages>

2.5. Executing CHECK pass (checking for obvious problems).
Checking module counter...
Found and reported 0 problems.

2.6. Executing OPT pass (performing simple optimizations).

2.6.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.6.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.6.3. Executing OPT_MUXTREE pass (detect dead branches in mux trees).
Running muxtree optimizer on module \counter..
  Creating internal representation of mux trees.
  Evaluating internal representation of mux trees.
  Analyzing evaluation results.
Removed 0 multiplexer ports.
<suppressed ~4 debug messages>

2.6.4. Executing OPT_REDUCE pass (consolidate $*mux and $reduce_* inputs).
  Optimizing cells in module \counter.
Performed a total of 0 changes.

2.6.5. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.6.6. Executing OPT_DFF pass (perform DFF optimizations).

2.6.7. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.6.8. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.6.9. Finished fast OPT passes. (There is nothing left to do.)

2.7. Executing FSM pass (extract and optimize FSM).

2.7.1. Executing FSM_DETECT pass (finding FSMs in design).

2.7.2. Executing FSM_EXTRACT pass (extracting FSM from design).

2.7.3. Executing FSM_OPT pass (simple optimizations of FSMs).

2.7.4. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.7.5. Executing FSM_OPT pass (simple optimizations of FSMs).

2.7.6. Executing FSM_RECODE pass (re-assigning FSM state encoding).

2.7.7. Executing FSM_INFO pass (dumping all available information on FSM cells).

2.7.8. Executing FSM_MAP pass (mapping FSMs to basic logic).

2.8. Executing OPT pass (performing simple optimizations).

2.8.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.8.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.8.3. Executing OPT_MUXTREE pass (detect dead branches in mux trees).
Running muxtree optimizer on module \counter..
  Creating internal representation of mux trees.
  Evaluating internal representation of mux trees.
  Analyzing evaluation results.
Removed 0 multiplexer ports.
<suppressed ~4 debug messages>

2.8.4. Executing OPT_REDUCE pass (consolidate $*mux and $reduce_* inputs).
  Optimizing cells in module \counter.
Performed a total of 0 changes.

2.8.5. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.8.6. Executing OPT_DFF pass (perform DFF optimizations).
Adding SRST signal on $procdff$11 ($dff) from module counter (D = $procmux$6_Y, Q = \count, rval = 8'00000000).
Adding EN signal on $auto$ff.cc:337:slice$12 ($sdff) from module counter (D = $procmux$6_Y, Q = \count).

2.8.7. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..
Removed 1 unused cells and 1 unused wires.
<suppressed ~2 debug messages>

2.8.8. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.
<suppressed ~1 debug messages>

2.8.9. Rerunning OPT passes. (Maybe there is more to do..)

2.8.10. Executing OPT_MUXTREE pass (detect dead branches in mux trees).
Running muxtree optimizer on module \counter..
  Creating internal representation of mux trees.
  Evaluating internal representation of mux trees.
  Analyzing evaluation results.
Removed 0 multiplexer ports.
<suppressed ~3 debug messages>

2.8.11. Executing OPT_REDUCE pass (consolidate $*mux and $reduce_* inputs).
  Optimizing cells in module \counter.
Performed a total of 0 changes.

2.8.12. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.8.13. Executing OPT_DFF pass (perform DFF optimizations).

2.8.14. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.8.15. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.8.16. Finished fast OPT passes. (There is nothing left to do.)

2.9. Executing WREDUCE pass (reducing word size of cells).

2.10. Executing PEEPOPT pass (run peephole optimizers).

2.11. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.12. Executing ALUMACC pass (create $alu and $macc cells).
Extracting $alu and $macc cells in module counter:
  creating $macc model for $add$counter.sv:20$2 ($add).
  creating $alu model for $macc $add$counter.sv:20$2.
  creating $alu cell for $add$counter.sv:20$2: $auto$alumacc.cc:512:replace_alu$16
  created 1 $alu and 0 $macc cells.

2.13. Executing SHARE pass (SAT-based resource sharing).

2.14. Executing OPT pass (performing simple optimizations).

2.14.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.14.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.14.3. Executing OPT_MUXTREE pass (detect dead branches in mux trees).
Running muxtree optimizer on module \counter..
  Creating internal representation of mux trees.
  Evaluating internal representation of mux trees.
  Analyzing evaluation results.
Removed 0 multiplexer ports.
<suppressed ~3 debug messages>

2.14.4. Executing OPT_REDUCE pass (consolidate $*mux and $reduce_* inputs).
  Optimizing cells in module \counter.
Performed a total of 0 changes.

2.14.5. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 5 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.14.6. Executing OPT_DFF pass (perform DFF optimizations).

2.14.7. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.14.8. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.14.9. Finished fast OPT passes. (There is nothing left to do.)

2.15. Executing MEMORY pass.

2.15.1. Executing OPT_MEM pass (optimize memories).
Performed a total of 0 transformations.

2.15.2. Executing OPT_MEM_PRIORITY pass (removing unnecessary memory write priority relations).
Performed a total of 0 transformations.

2.15.3. Executing OPT_MEM_FEEDBACK pass (finding memory read-to-write feedback paths).

2.15.4. Executing MEMORY_BMUX2ROM pass (converting muxes to ROMs).

2.15.5. Executing MEMORY_DFF pass (merging $dff cells to $memrd).

2.15.6. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.15.7. Executing MEMORY_SHARE pass (consolidating $memrd/$memwr cells).

2.15.8. Executing OPT_MEM_WIDEN pass (optimize memories where all ports are wide).
Performed a total of 0 transformations.

2.15.9. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.15.10. Executing MEMORY_COLLECT pass (generating $mem cells).

2.16. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.17. Executing OPT pass (performing simple optimizations).

2.17.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.
<suppressed ~1 debug messages>

2.17.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 4 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.17.3. Executing OPT_DFF pass (perform DFF optimizations).

2.17.4. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..
Removed 0 unused cells and 1 unused wires.
<suppressed ~1 debug messages>

2.17.5. Finished fast OPT passes.

2.18. Executing MEMORY_MAP pass (converting memories to logic and flip-flops).

2.19. Executing OPT pass (performing simple optimizations).

2.19.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.19.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 4 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.19.3. Executing OPT_MUXTREE pass (detect dead branches in mux trees).
Running muxtree optimizer on module \counter..
  Creating internal representation of mux trees.
  Evaluating internal representation of mux trees.
  Analyzing evaluation results.
Removed 0 multiplexer ports.
<suppressed ~2 debug messages>

2.19.4. Executing OPT_REDUCE pass (consolidate $*mux and $reduce_* inputs).
  Optimizing cells in module \counter.
Performed a total of 0 changes.

2.19.5. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 4 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.19.6. Executing OPT_SHARE pass.

2.19.7. Executing OPT_DFF pass (perform DFF optimizations).

2.19.8. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..

2.19.9. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.19.10. Finished fast OPT passes. (There is nothing left to do.)

2.20. Executing TECHMAP pass (map to technology primitives).

2.20.1. Executing Verilog-2005 frontend: /opt/homebrew/bin/../share/yosys/techmap.v
Parsing Verilog input from `/opt/homebrew/bin/../share/yosys/techmap.v' to AST representation.
verilog frontend filename /opt/homebrew/bin/../share/yosys/techmap.v
Generating RTLIL representation for module `\_90_simplemap_bool_ops'.
Generating RTLIL representation for module `\_90_simplemap_reduce_ops'.
Generating RTLIL representation for module `\_90_simplemap_logic_ops'.
Generating RTLIL representation for module `\_90_simplemap_compare_ops'.
Generating RTLIL representation for module `\_90_simplemap_various'.
Generating RTLIL representation for module `\_90_simplemap_registers'.
Generating RTLIL representation for module `\_90_shift_ops_shr_shl_sshl_sshr'.
Generating RTLIL representation for module `\_90_shift_shiftx'.
Generating RTLIL representation for module `\_90_fa'.
Generating RTLIL representation for module `\_90_lcu_brent_kung'.
Generating RTLIL representation for module `\_90_alu'.
Generating RTLIL representation for module `\_90_macc'.
Generating RTLIL representation for module `\_90_alumacc'.
Generating RTLIL representation for module `\$__div_mod_u'.
Generating RTLIL representation for module `\$__div_mod_trunc'.
Generating RTLIL representation for module `\_90_div'.
Generating RTLIL representation for module `\_90_mod'.
Generating RTLIL representation for module `\$__div_mod_floor'.
Generating RTLIL representation for module `\_90_divfloor'.
Generating RTLIL representation for module `\_90_modfloor'.
Generating RTLIL representation for module `\_90_pow'.
Generating RTLIL representation for module `\_90_pmux'.
Generating RTLIL representation for module `\_90_demux'.
Generating RTLIL representation for module `\_90_lut'.
Generating RTLIL representation for module `\$connect'.
Generating RTLIL representation for module `\$input_port'.
Successfully finished Verilog frontend.

2.20.2. Continuing TECHMAP pass.
Using template $paramod$c3cd1564c35d873179656addd6052d7ea8b6d991\_90_alu for cells of type $alu.
Using extmapper simplemap for cells of type $reduce_bool.
Using extmapper simplemap for cells of type $sdffe.
Using extmapper simplemap for cells of type $mux.
Using extmapper simplemap for cells of type $xor.
Using template $paramod\_90_fa\WIDTH=32'00000000000000000000000000001000 for cells of type $fa.
Using template $paramod\_90_lcu_brent_kung\WIDTH=32'00000000000000000000000000001000 for cells of type $lcu.
Using extmapper simplemap for cells of type $pos.
Using extmapper simplemap for cells of type $not.
Using extmapper simplemap for cells of type $or.
Using extmapper simplemap for cells of type $and.
No more expansions possible.
<suppressed ~266 debug messages>

2.21. Executing OPT pass (performing simple optimizations).

2.21.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.
<suppressed ~67 debug messages>

2.21.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 44 cells of `\counter'.
Finding duplicate cells in `\counter'.
Computing hashes of 43 cells of `\counter'.
Finding duplicate cells in `\counter'.
<suppressed ~3 debug messages>
Removed a total of 1 cells.

2.21.3. Executing OPT_DFF pass (perform DFF optimizations).

2.21.4. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..
Removed 10 unused cells and 59 unused wires.
<suppressed ~11 debug messages>

2.21.5. Finished fast OPT passes.

2.22. Executing ABC pass (technology mapping using ABC).

2.22.1. Extracting gate netlist of module `\counter' to `<abc-temp-dir>/input.blif'..

2.22.1.1. Executed ABC.
Extracted 25 gates and 43 wires to a netlist network with 18 inputs and 9 outputs.
Running ABC script: <abc-temp-dir>/abc.script
ABC: ======== ABC command line "source <abc-temp-dir>/abc.script"
ABC: + read_blif <abc-temp-dir>/input.blif 
ABC: + read_library /var/folders/1n/c3_17dqs3m771clj0zlhy4b40000gn/T/yosys-abc-2N0qtJ/stdcells.genlib 
ABC: + strash 
ABC: + dretime 
ABC: + map 
ABC: + write_blif <abc-temp-dir>/output.blif 

2.22.1.2. Re-integrating ABC results.
ABC RESULTS:            ANDNOT cells:        3
ABC RESULTS:               MUX cells:        8
ABC RESULTS:              NAND cells:        3
ABC RESULTS:               NOT cells:        1
ABC RESULTS:                OR cells:        3
ABC RESULTS:              XNOR cells:        3
ABC RESULTS:               XOR cells:        4
ABC RESULTS:        internal signals:       16
ABC RESULTS:           input signals:       18
ABC RESULTS:          output signals:        9
Removing temp directory.
Removing global temp directory.

2.23. Executing OPT pass (performing simple optimizations).

2.23.1. Executing OPT_EXPR pass (perform const folding).
Optimizing module counter.

2.23.2. Executing OPT_MERGE pass (detect identical cells).
Finding identical cells in module `\counter'.
Computing hashes of 33 cells of `\counter'.
Finding duplicate cells in `\counter'.
Removed a total of 0 cells.

2.23.3. Executing OPT_DFF pass (perform DFF optimizations).

2.23.4. Executing OPT_CLEAN pass (remove unused cells and wires).
Finding unused cells or wires in module \counter..
Removed 0 unused cells and 25 unused wires.
<suppressed ~1 debug messages>

2.23.5. Finished fast OPT passes.

2.24. Executing HIERARCHY pass (managing design hierarchy).
Attribute `top' found on module `counter'. Setting top module to counter.

2.24.1. Analyzing design hierarchy..
Top module:  \counter

2.24.2. Analyzing design hierarchy..
Top module:  \counter
Removed 0 unused modules.

2.25. Printing statistics.

=== counter ===

        +----------Local Count, excluding submodules.
        | 
       31 wires
       45 wire bits
        6 public wires
       20 public wire bits
        6 ports
       20 port bits
       33 cells
        3   $_ANDNOT_
        8   $_MUX_
        3   $_NAND_
        1   $_NOT_
        3   $_OR_
        8   $_SDFFE_PP0P_
        3   $_XNOR_
        4   $_XOR_

2.26. Executing CHECK pass (checking for obvious problems).
Checking module counter...
Found and reported 0 problems.
```
