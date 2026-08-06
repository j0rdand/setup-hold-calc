
function generateWaveform(suh_case,ckt_case) {
  // console.log("generateWaveform");
  var idev = '';
  var tclksel = '';
  var maxsel  = '';
  var device_dat_out = '';
  var device_dat_in  = '';
  var tco_tail = '';
  var data_out_phase = 0;
  if (ckt_case == 'skew') {
    idev = 'slave';
    device_dat_out = 'Master';
    device_dat_in  = 'Slave';
    tco_tail = 'F';
    if (suh_case == 'su') {
      tclksel = 'min';
      maxsel  = 'max';
    } else {
      tclksel = 'max';
      maxsel  = 'min';
    }
  } else {
    idev = 'master';
    device_dat_out = 'Slave';
    device_dat_in  = 'Master';
    tco_tail = 'G';
    if (suh_case == 'su') {
      tclksel = 'max';
      maxsel  = 'max';
    } else {
      tclksel = 'min';
      maxsel  = 'min';
    }
  }
  var t_clk = parseFloat(document.getElementById(idev+"_t_clk_"+tclksel+"_input").value);
  var t_dat = parseFloat(document.getElementById(idev+"_t_dat_"+maxsel+"_input").value);
  var t_co  = parseFloat(document.getElementById(idev+"_t_co_"+maxsel+"_input").value);
  var t_req = parseFloat(document.getElementById(idev+"_t_"+suh_case+"_input").value);
  var launch_rising = document.getElementById(idev+'_launch_rising_input').selected;
  var latch_rising = document.getElementById(idev+'_latch_rising_input').selected;
  
  var t_p = parseFloat(document.getElementById("t_p_input").value);
  var per_tick = parseFloat(document.getElementById("per_tick_input").value);
  var tick_offset = parseFloat(document.getElementById("tick_offset_input").value);
  var arrow = document.getElementById("arrow_input").value;
  
  // calculation:
  var margin = 0;
  var actual_arrow = '';
  var t_clk_arrow = '';
  var clk_string = '';
  var clk_rel = 0;
  var ckt_time = 0;
  
  if (launch_rising) {
    clk_string = '01010';
  } else {  
    clk_string = '10101';
  }
  
  if (launch_rising != latch_rising) {
    // TODO account for clock duty cycle
    clk_rel = t_p/2;
    if (ckt_case == 'skew') {
      actual_arrow = 'H';
    } else {
      actual_arrow = 'E';
    }
  } else {
    if (suh_case == 'su') {
      clk_rel = t_p;
    } else {
      clk_rel = 0;
    }
    if (ckt_case == 'skew') {
      actual_arrow = 'B';
    } else {
      actual_arrow = 'A';
    }
  }
  
  
  if (ckt_case == 'skew') {
    ckt_time = -t_clk+t_co+t_dat;
    data_out_phase = -t_co/per_tick;
    t_clk_arrow = 'A'+arrow+'B '+t_clk;
  } else {
    ckt_time = t_clk+t_co+t_dat;
    data_out_phase = -(t_co+t_clk)/per_tick;
    t_clk_arrow = 'F'+arrow+'G '+t_clk;
  }
  
  if (suh_case == 'su') {
    margin = clk_rel-ckt_time-t_req;
    actual_arrow = 'D'+arrow+actual_arrow+' setup = '+(margin+t_req);
  } else {
    margin = clk_rel+ckt_time-t_req;
    actual_arrow = actual_arrow+arrow+'J hold = '+(margin+t_req);
  }
     
  var wdjson = { signal: [
    { name: 'Master Clk Out', wave: clk_string,  node: '.FEA', period: (t_p/2)/per_tick, phase: tick_offset+(t_p/2)/per_tick },
    { name: 'Slave Clk In', wave: clk_string,  node: '.GHB', period: (t_p/2)/per_tick, phase: -1*t_clk/per_tick+tick_offset+(t_p/2)/per_tick},
    { name: device_dat_out+' Data Out', wave: '===',  node: '.C', period: (t_p)/per_tick, phase: data_out_phase+tick_offset+(t_p)/per_tick},
    { name: device_dat_in+' Data In', wave: '===',  node: '.DJ', period: (t_p)/per_tick, phase: data_out_phase-t_dat/per_tick+tick_offset+(t_p)/per_tick },
    ],
    edge: [
      t_clk_arrow, tco_tail+arrow+'C '+t_co, 'C'+arrow+'D '+t_dat, 'F<->A '+t_p, actual_arrow 
    ],
   config: { skin: 'narrow' }
  };
  
  var waveContainer = document.getElementById(idev + "_wavedrom_render_" + suh_case);
  waveContainer.innerHTML = '<script type="WaveDrom">' + JSON.stringify(wdjson) + '<\/script>';
  
  //write notes for the design constraints:
  if (suh_case == 'su') {
    // solve the margin equation for t_req, with 0 margin
    document.getElementById(idev+"_t_"+suh_case+"_note").innerHTML = (margin+t_req)+' maximum';
    // solve the margin equation for t_co, with 0 margin
    document.getElementById(idev+"_t_co_"+maxsel+"_note").innerHTML = (margin+t_co)+' maximum';
    if (ckt_case == 'skew') {
      // solve the margin equation for t_dat-t_clk, with 0 margin
      document.getElementById(idev+"_t_clk_"+tclksel+"_note").innerHTML = (margin+t_dat-t_clk)+' maximum skew (data minus clk)'; 
      document.getElementById(idev+"_t_dat_"+maxsel +"_note").innerHTML = (margin+t_dat-t_clk)+' maximum skew (data minus clk)'; 
    } else {
      // solve the margin equation for t_clk+t_dat, with 0 margin:
      document.getElementById(idev+"_t_clk_"+tclksel+"_note").innerHTML = (margin+t_dat+t_clk)+' maximum clk+data delay'; 
      document.getElementById(idev+"_t_dat_"+maxsel +"_note").innerHTML = (margin+t_dat+t_clk)+' maximum clk+data delay'; 
    }
  } else {
    document.getElementById(idev+"_t_"+suh_case+"_note").innerHTML = (margin+t_req)+' maximum';
    document.getElementById(idev+"_t_co_"+maxsel+"_note").innerHTML = (t_co-margin)+' minimum';
    if (ckt_case == 'skew') {
      // solve the margin equation for t_dat-t_clk, with 0 margin
      document.getElementById(idev+"_t_clk_"+tclksel+"_note").innerHTML = (t_dat-t_clk-margin)+' minimum skew (data minus clk)';  
      document.getElementById(idev+"_t_dat_"+maxsel +"_note").innerHTML = (t_dat-t_clk-margin)+' minimum skew (data minus clk)';  
    } else {
      // solve the margin equation for t_clk+t_dat, with 0 margin:
      document.getElementById(idev+"_t_clk_"+tclksel+"_note").innerHTML = (t_dat+t_clk-margin)+' minimum clk+data delay'; 
      document.getElementById(idev+"_t_dat_"+maxsel +"_note").innerHTML = (t_dat+t_clk-margin)+' minimum clk+data delay'; 
    }
  }

  //report the margin:
  document.getElementById(idev+"_"+suh_case+"_margin").innerHTML = 'Margin = '+margin;
  if (margin < 0) {
    document.getElementById(idev+"_"+suh_case+"_margin").className = "note_alert";
  } else {
    document.getElementById(idev+"_"+suh_case+"_margin").className = "note";
  }
}

function updateTclkValues() {
  if (document.getElementById('master_t_clk_max_div').style.display == 'none') {
    document.getElementById('master_t_clk_max_input').value = document.getElementById('slave_t_clk_max_input').value;
  }
  if (document.getElementById('slave_t_clk_max_div').style.display == 'none') {
    document.getElementById('slave_t_clk_max_input').value = document.getElementById('master_t_clk_max_input').value;
  }
  if (document.getElementById('master_t_clk_min_div').style.display == 'none') {
    document.getElementById('master_t_clk_min_input').value = document.getElementById('slave_t_clk_min_input').value;
  }
  if (document.getElementById('slave_t_clk_min_div').style.display == 'none') {
    document.getElementById('slave_t_clk_min_input').value = document.getElementById('master_t_clk_min_input').value;
  }
}

function updateTdatValues() {
  if (document.getElementById('master_t_dat_max_div').style.display == 'none') {
    document.getElementById('master_t_dat_max_input').value = document.getElementById('slave_t_dat_max_input').value;
  }
  if (document.getElementById('slave_t_dat_max_div').style.display == 'none') {
    document.getElementById('slave_t_dat_max_input').value = document.getElementById('master_t_dat_max_input').value;
  }
  if (document.getElementById('master_t_dat_min_div').style.display == 'none') {
    document.getElementById('master_t_dat_min_input').value = document.getElementById('slave_t_dat_min_input').value;
  }
  if (document.getElementById('slave_t_dat_min_div').style.display == 'none') {
    document.getElementById('slave_t_dat_min_input').value = document.getElementById('master_t_dat_min_input').value;
  }
}

function updateDisplayedInputs() {
  // console.log("updateDisplayedInputs");
  var slave_disp = 'none';
  var master_disp = 'none';
  var slave_t_clk_disp = '';
  var slave_t_dat_disp = '';
  // the current state is whatever is opposite of the button text.
  var isByDevice = (document.getElementById('input_layout_toggle').innerHTML == 'Inputs by Case');
  if (document.getElementById('dat_device_master').selected) {
    slave_disp = '';
    master_disp = 'none';
    slave_t_clk_disp = slave_disp;
    slave_t_dat_disp = slave_disp;
    document.getElementById('slave_t_dat_max_input').disabled = false;
    document.getElementById('slave_t_dat_min_input').disabled = false;
    document.getElementById('slave_t_clk_max_input').disabled = false;
    document.getElementById('slave_t_clk_min_input').disabled = false;
  } else if (document.getElementById('dat_device_slave').selected) {
    slave_disp = 'none';
    master_disp = '';
    slave_t_clk_disp = slave_disp;
    slave_t_dat_disp = slave_disp;
    document.getElementById('slave_t_dat_max_input').disabled = false;
    document.getElementById('slave_t_dat_min_input').disabled = false;
    document.getElementById('slave_t_clk_max_input').disabled = false;
    document.getElementById('slave_t_clk_min_input').disabled = false;
  } else {
    slave_disp = '';
    master_disp = '';
    document.getElementById('slave_t_clk_max_input').disabled = true;
    document.getElementById('slave_t_clk_min_input').disabled = true;
    // TODO css style for disabled
    slave_t_clk_disp = isByDevice ? 'none' : slave_disp;
    slave_t_dat_disp = slave_disp;
    // auto fill the previously undisplayed input with the displayed one:
    updateTclkValues();
    if (document.getElementById('dat_device_both').selected) {
      document.getElementById('slave_t_dat_max_input').disabled = false;
      document.getElementById('slave_t_dat_min_input').disabled = false;
    } else {
      //TODO change the inner text from "MOSI" or "MISO" to just "data"
      document.getElementById('slave_t_dat_max_input').disabled = true;
      document.getElementById('slave_t_dat_min_input').disabled = true;
      slave_t_dat_disp = isByDevice ? 'none' : slave_disp;
      updateTdatValues();
    }
  }
  // Update input card displays according to selected organization.
  if (isByDevice) {
    document.getElementById('master_device_div').style.display = '';
    document.getElementById('slave_device_div').style.display = '';
    document.getElementById('board_div').style.display = '';
    
    document.getElementById('clock_div').style.display = 'none';
    document.getElementById('master_setup_div').style.display = 'none';
    document.getElementById('master_hold_div').style.display = 'none';
    document.getElementById('slave_setup_div').style.display = 'none';
    document.getElementById('slave_hold_div').style.display = 'none';
  } else {
    document.getElementById('master_device_div').style.display = 'none';
    document.getElementById('slave_device_div').style.display = 'none';
    document.getElementById('board_div').style.display = 'none';
    
    document.getElementById('clock_div').style.display = '';
    document.getElementById('master_setup_div').style.display = master_disp;
    document.getElementById('master_hold_div').style.display = master_disp;
    document.getElementById('slave_setup_div').style.display = slave_disp;
    document.getElementById('slave_hold_div').style.display = slave_disp;
  }
    
  // set display of individual input fields
  document.getElementById('t_p_div').style.display = '';
  document.getElementById('slave_launch_div').style.display = slave_disp;
  document.getElementById('slave_t_co_min_div').style.display = slave_disp;
  document.getElementById('slave_t_co_max_div').style.display = slave_disp;
  document.getElementById('master_latch_div').style.display = master_disp;
  document.getElementById('master_t_su_div').style.display = master_disp;
  document.getElementById('master_t_h_div').style.display = master_disp;

  document.getElementById('master_launch_div').style.display = master_disp;
  document.getElementById('master_t_co_min_div').style.display = master_disp;
  document.getElementById('master_t_co_max_div').style.display = master_disp;
  document.getElementById('slave_latch_div').style.display = slave_disp;
  document.getElementById('slave_t_su_div').style.display = slave_disp;
  document.getElementById('slave_t_h_div').style.display = slave_disp;

  document.getElementById('master_t_clk_min_div').style.display = master_disp;
  document.getElementById('master_t_clk_max_div').style.display = master_disp;
  document.getElementById('master_t_dat_min_div').style.display = master_disp;
  document.getElementById('master_t_dat_max_div').style.display = master_disp;
  document.getElementById('slave_t_clk_min_div').style.display = slave_t_clk_disp;
  document.getElementById('slave_t_clk_max_div').style.display = slave_t_clk_disp;
  document.getElementById('slave_t_dat_min_div').style.display = slave_t_dat_disp;
  document.getElementById('slave_t_dat_max_div').style.display = slave_t_dat_disp;
    
  document.getElementById('master_wave_su_div').style.display = master_disp;
  document.getElementById('master_wave_h_div').style.display = master_disp;
  document.getElementById('master_launch_div').style.display = master_disp;
  document.getElementById('master_latch_div').style.display = master_disp;
  document.getElementById('slave_wave_su_div').style.display = slave_disp;
  document.getElementById('slave_wave_h_div').style.display = slave_disp;
  document.getElementById('slave_launch_div').style.display = slave_disp;
  document.getElementById('slave_latch_div').style.display = slave_disp;
  
  //Now update displays relative to the design variable:
  if (document.getElementById('design_var_board').selected) {
    document.getElementById('master_sdc_div').style.display = 'none';
    document.getElementById('slave_sdc_div').style.display = 'none';
    document.getElementById('trace_const_div').style.display = '';
    document.getElementById('master_t_su_note').style.display = 'none';
    document.getElementById('master_t_clk_max_note').style.display = '';
    document.getElementById('master_t_dat_max_note').style.display = '';
    document.getElementById('master_t_co_max_note').style.display = 'none';
    document.getElementById('master_t_h_note').style.display = 'none';
    document.getElementById('master_t_clk_min_note').style.display = '';
    document.getElementById('master_t_dat_min_note').style.display = '';
    document.getElementById('master_t_co_min_note').style.display = 'none';
    document.getElementById('slave_t_su_note').style.display = 'none';
    document.getElementById('slave_t_clk_min_note').style.display = '';
    document.getElementById('slave_t_dat_max_note').style.display = '';
    document.getElementById('slave_t_co_max_note').style.display = 'none';
    document.getElementById('slave_t_h_note').style.display = 'none';
    document.getElementById('slave_t_clk_max_note').style.display = '';
    document.getElementById('slave_t_dat_min_note').style.display = '';
    document.getElementById('slave_t_co_min_note').style.display = 'none';
  } else if (document.getElementById('design_var_master').selected) {
    document.getElementById('master_sdc_div').style.display = '';
    document.getElementById('slave_sdc_div').style.display = 'none';
    document.getElementById('trace_const_div').style.display = 'none';
    document.getElementById('master_t_su_note').style.display = '';
    document.getElementById('master_t_clk_max_note').style.display = 'none';
    document.getElementById('master_t_dat_max_note').style.display = 'none';
    document.getElementById('master_t_co_max_note').style.display = 'none';
    document.getElementById('master_t_h_note').style.display = '';
    document.getElementById('master_t_clk_min_note').style.display = 'none';
    document.getElementById('master_t_dat_min_note').style.display = 'none';
    document.getElementById('master_t_co_min_note').style.display = 'none';
    document.getElementById('slave_t_su_note').style.display = 'none';
    document.getElementById('slave_t_clk_min_note').style.display = 'none';
    document.getElementById('slave_t_dat_max_note').style.display = 'none';
    document.getElementById('slave_t_co_max_note').style.display = '';
    document.getElementById('slave_t_h_note').style.display = 'none';
    document.getElementById('slave_t_clk_max_note').style.display = 'none';
    document.getElementById('slave_t_dat_min_note').style.display = 'none';
    document.getElementById('slave_t_co_min_note').style.display = '';
  } else {
    document.getElementById('master_sdc_div').style.display = 'none';
    document.getElementById('slave_sdc_div').style.display = '';
    document.getElementById('trace_const_div').style.display = 'none';
    document.getElementById('master_t_su_note').style.display = 'none';
    document.getElementById('master_t_clk_max_note').style.display = 'none';
    document.getElementById('master_t_dat_max_note').style.display = 'none';
    document.getElementById('master_t_co_max_note').style.display = '';
    document.getElementById('master_t_h_note').style.display = 'none';
    document.getElementById('master_t_clk_min_note').style.display = 'none';
    document.getElementById('master_t_dat_min_note').style.display = 'none';
    document.getElementById('master_t_co_min_note').style.display = '';
    document.getElementById('slave_t_su_note').style.display = '';
    document.getElementById('slave_t_clk_min_note').style.display = 'none';
    document.getElementById('slave_t_dat_max_note').style.display = 'none';
    document.getElementById('slave_t_co_max_note').style.display = 'none';
    document.getElementById('slave_t_h_note').style.display = '';
    document.getElementById('slave_t_clk_max_note').style.display = 'none';
    document.getElementById('slave_t_dat_min_note').style.display = 'none';
    document.getElementById('slave_t_co_min_note').style.display = 'none';
  }
  
  updateDisplayedInputLayout(isByDevice);
}

function updateDisplayedInputLayout(isByDevice) {
  // the current state is whatever is opposite of the button text.
  // isByDevice = (document.getElementById('input_layout_toggle').innerHTML == 'Inputs by Case');

  if (isByDevice) {
    document.getElementById('master_device_div').appendChild(document.getElementById('t_p_div'));
    document.getElementById('master_device_div').appendChild(document.getElementById('slave_launch_div'));
    document.getElementById('master_device_div').appendChild(document.getElementById('slave_t_co_min_div'));
    document.getElementById('master_device_div').appendChild(document.getElementById('slave_t_co_max_div'));
    document.getElementById('master_device_div').appendChild(document.getElementById('master_latch_div'));
    document.getElementById('master_device_div').appendChild(document.getElementById('master_t_su_div'));
    document.getElementById('master_device_div').appendChild(document.getElementById('master_t_h_div'));

    document.getElementById('slave_device_div').appendChild(document.getElementById('master_launch_div'));
    document.getElementById('slave_device_div').appendChild(document.getElementById('master_t_co_min_div'));
    document.getElementById('slave_device_div').appendChild(document.getElementById('master_t_co_max_div'));
    document.getElementById('slave_device_div').appendChild(document.getElementById('slave_latch_div'));
    document.getElementById('slave_device_div').appendChild(document.getElementById('slave_t_su_div'));
    document.getElementById('slave_device_div').appendChild(document.getElementById('slave_t_h_div'));

    document.getElementById('board_div').appendChild(document.getElementById('master_t_clk_min_div'));
    document.getElementById('board_div').appendChild(document.getElementById('master_t_clk_max_div'));
    document.getElementById('board_div').appendChild(document.getElementById('master_t_dat_min_div'));
    document.getElementById('board_div').appendChild(document.getElementById('master_t_dat_max_div'));
    document.getElementById('board_div').appendChild(document.getElementById('slave_t_clk_min_div'));
    document.getElementById('board_div').appendChild(document.getElementById('slave_t_clk_max_div'));
    document.getElementById('board_div').appendChild(document.getElementById('slave_t_dat_min_div'));
    document.getElementById('board_div').appendChild(document.getElementById('slave_t_dat_max_div'));
  }
  else {
    document.getElementById('clock_div').appendChild(document.getElementById('t_p_div'));
    document.getElementById('clock_div').appendChild(document.getElementById('slave_launch_div'));
    document.getElementById('clock_div').appendChild(document.getElementById('master_latch_div'));
    document.getElementById('clock_div').appendChild(document.getElementById('master_launch_div'));
    document.getElementById('clock_div').appendChild(document.getElementById('slave_latch_div'));
    
    document.getElementById('master_setup_div').appendChild(document.getElementById('master_t_su_div'));
    document.getElementById('master_setup_div').appendChild(document.getElementById('master_t_clk_max_div'));
    document.getElementById('master_setup_div').appendChild(document.getElementById('master_t_dat_max_div'));
    document.getElementById('master_setup_div').appendChild(document.getElementById('master_t_co_max_div'));
    
    document.getElementById('master_hold_div').appendChild(document.getElementById('master_t_h_div'));
    document.getElementById('master_hold_div').appendChild(document.getElementById('master_t_clk_min_div'));
    document.getElementById('master_hold_div').appendChild(document.getElementById('master_t_dat_min_div'));
    document.getElementById('master_hold_div').appendChild(document.getElementById('master_t_co_min_div'));
    
    document.getElementById('slave_setup_div').appendChild(document.getElementById('slave_t_su_div'));
    document.getElementById('slave_setup_div').appendChild(document.getElementById('slave_t_clk_min_div'));
    document.getElementById('slave_setup_div').appendChild(document.getElementById('slave_t_dat_max_div'));
    document.getElementById('slave_setup_div').appendChild(document.getElementById('slave_t_co_max_div'));
    
    document.getElementById('slave_hold_div').appendChild(document.getElementById('slave_t_h_div'));
    document.getElementById('slave_hold_div').appendChild(document.getElementById('slave_t_clk_max_div'));
    document.getElementById('slave_hold_div').appendChild(document.getElementById('slave_t_dat_min_div'));
    document.getElementById('slave_hold_div').appendChild(document.getElementById('slave_t_co_min_div'));
  }
}

function generateConstraints() {
  var master_string = '';
  var slave_string = '';
  var common_string = '';
  
  master_string = ''+
'## User must define clocks first, including "ext_clk_at_pin" referenced below.\n'+
'# Define the parameters:\n';
  slave_string = master_string;

  if (document.getElementById('dat_device_master').selected == true) {
    common_string = ''+
'set clk_pcb_min '+document.getElementById('slave_t_clk_min_input').value+'\n'+
'set clk_pcb_max '+document.getElementById('slave_t_clk_max_input').value+'\n';
  } else {
    common_string = ''+
'set clk_pcb_min '+document.getElementById('master_t_clk_min_input').value+'\n'+
'set clk_pcb_max '+document.getElementById('master_t_clk_max_input').value+'\n';
  }
  master_string = master_string + common_string;
  slave_string = slave_string + common_string;
  
  if (document.getElementById('dat_device_master').selected == false) {
    common_string = ''+
'set miso_pcb_min '+document.getElementById('master_t_dat_min_input').value+'\n'+
'set miso_pcb_max '+document.getElementById('master_t_dat_max_input').value+'\n';

    master_string = master_string + common_string +
'set miso_tco_max '+document.getElementById('master_t_co_max_input').value+'\n'+
'set miso_tco_min '+document.getElementById('master_t_co_min_input').value+'\n';

    slave_string = slave_string + common_string +
'set miso_su '+document.getElementById('master_t_su_input').value+'\n'+
'set miso_h  '+document.getElementById('master_t_h_input').value+'\n';
  }

  if (document.getElementById('dat_device_slave').selected == false) {
    common_string = ''+
'set mosi_pcb_min '+document.getElementById('slave_t_dat_min_input').value+'\n'+
'set mosi_pcb_max '+document.getElementById('slave_t_dat_max_input').value+'\n';
    
    master_string = master_string + common_string +
'set mosi_su '+document.getElementById('slave_t_su_input').value+'\n'+
'set mosi_h  '+document.getElementById('slave_t_h_input').value+'\n'+
'# Apply constraint to mosi pin relative to the external clock pin: (See equations 1 and 2 of Altera AN 433)\n'+
'set_output_delay -clock [get_clocks ext_clk_at_pin] -max [expr $mosi_pcb_max + $mosi_su - $clk_pcb_min] [get_ports mosi] -clock_fall\n'+
'set_output_delay -clock [get_clocks ext_clk_at_pin] -min [expr $mosi_pcb_min - $mosi_h  - $clk_pcb_max] [get_ports mosi] -clock_fall -add_delay\n';

    slave_string = slave_string + common_string +
'set mosi_tco_max '+document.getElementById('slave_t_co_max_input').value+'\n'+
'set mosi_tco_min '+document.getElementById('slave_t_co_min_input').value+'\n'+
'# Apply constraint to mosi pin relative to the external clock pin: (See equations 23 and 24 of Altera AN 433)\n'+
'set_input_delay -clock [get_clocks ext_clk_at_pin] -max [expr $mosi_tco_max + $mosi_pcb_max - $clk_pcb_min] [get_ports mosi]\n'+
'set_input_delay -clock [get_clocks ext_clk_at_pin] -min [expr $mosi_tco_min + $mosi_pcb_min - $clk_pcb_max] [get_ports mosi] -add_delay\n';
  }
  
  if (document.getElementById('dat_device_master').selected == false) {
    master_string = master_string+
'# Apply constraint to miso pin relative to the external clock pin: (Not source-synchronous; from equations 23 and 24 of Altera AN 433, reverse the sign and min/max on clk_pcb delay)\n'+
'set_input_delay -clock [get_clocks ext_clk_at_pin] -max [expr $miso_tco_max + $miso_pcb_max + $clk_pcb_max] [get_ports miso]\n'+
'set_input_delay -clock [get_clocks ext_clk_at_pin] -min [expr $miso_tco_min + $miso_pcb_min + $clk_pcb_min] [get_ports miso] -add_delay\n';

    slave_string = slave_string+
'# Apply constraint to miso pin relative to the external clock pin: (Not source-synchronous; from equations 1 and 2 of Altera AN 433, reverse the sign and min/max on clk_pcb delay)\n'+
'set_output_delay -clock [get_clocks ext_clk_at_pin] -max [expr $miso_pcb_max + $miso_su + $clk_pcb_max] [get_ports miso] -clock_fall\n'+
'set_output_delay -clock [get_clocks ext_clk_at_pin] -min [expr $miso_pcb_min - $miso_h  + $clk_pcb_min] [get_ports miso] -clock_fall -add_delay\n';
  }
  
  document.getElementById('master_sdc').value = master_string;
  document.getElementById('slave_sdc').value = slave_string;
}
  
function renderAll() {
  // console.log("Attached to:", event.currentTarget.id);
  if ((event.currentTarget.id == undefined) || 
      (event.currentTarget.id == 'design_var_select') ||
      (event.currentTarget.id == 'dat_device_select')) {
    updateDisplayedInputs();
  }
  updateTclkValues();
  updateTdatValues();
  if (document.getElementById('dat_device_master').selected) {
    // same direction case, concerns skew b/w clk and data.
    generateWaveform('su','skew');
    generateWaveform('h','skew');
  } else if (document.getElementById('dat_device_slave').selected) {
    // round trip case, concerns sum of clk and data.
    generateWaveform('su','sum');
    generateWaveform('h','sum');
  } else {
    // combined case
    generateWaveform('su','skew');
    generateWaveform('h','skew');
    generateWaveform('su','sum');
    generateWaveform('h','sum');
  }
  WaveDrom.ProcessAll();
  scaleWavedrom();
  generateConstraints();
  
  //TODO put fmax in note
  //TODO print trace length constraints
  //TODO JSON format for a part: master or slave parameters, auto loads into the calculator.
  //TODO print page option
  //TODO url to recover the page with all inputs.
  //TODO allow for DDR. (simply doubles clock rate, but there are additional sdc constraints)
  //TODO make SDC use the correct clock edge.
}


function registerOnChange() {
  var inputs = document.querySelectorAll('input, select');
  for (var i = 0; i < inputs.length; i += 1) {
    inputs[i].addEventListener("change", renderAll);
    inputs[i].addEventListener("keyup", renderAll);
  }
}

function scaleWavedrom() {
  var zoomValue = parseFloat(document.getElementById("wd_zoom_input").value);
  if (isNaN(zoomValue)) {
    zoomValue = 1.0;
  }
  const svgs = document.querySelectorAll('.WaveDrom');
  const divs = document.querySelectorAll('.wavedrom-wrapper');
  svgs.forEach(svg => {
      oldWidth = parseFloat(svg.getAttribute('width'));
      oldHeight = parseFloat(svg.getAttribute('height'));
      svg.setAttribute('width', oldWidth*zoomValue);
      svg.setAttribute('height', oldHeight*zoomValue);
  });
}

function toggleInputLayout() {
    const btn = document.getElementById('input_layout_toggle');
    isByDevice = (btn.innerHTML == 'Inputs by Case');
    localStorage.setItem('deviceLayout', !isByDevice ? 'enabled' : 'disabled');
    
    // Update button text/icon
    btn.innerHTML = isByDevice ? 'Inputs by Device' : 'Inputs by Case';
    updateDisplayedInputs();
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkMode', isDark ? 'enabled' : 'disabled');
    
    // Update button text/icon
    const btn = document.getElementById('dark_mode_toggle');
    btn.innerHTML = isDark ? 'Light Mode' : 'Dark Mode';
}

// Automatically load user's preferred mode on page load
window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('darkMode') === 'enabled') {
        document.body.classList.add('dark-theme');
        const btn = document.getElementById('dark_mode_toggle');
        if (btn) btn.innerHTML = 'Light Mode';
    }
    if (localStorage.getItem('deviceLayout') === 'enabled') {
        const btn = document.getElementById('input_layout_toggle');
        if (btn) btn.innerHTML = 'Inputs by Case';
    }
    registerOnChange();
    renderAll();
});
