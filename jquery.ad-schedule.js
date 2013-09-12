/**
 * ad_schedule
 * 
 * @author lucasho <cqlucasho@gmail.com>
 * @update 2013.9.12
 * @version 1.0
 * 
 * example:
 *     $.AdSchedule({
 *                    head: $('.status'),
 *                    postUrl: "<?php echo _url(array('action'=>'select'));?>",
 *                    downcsv: "<?php echo _url(array('action'=>'export'));?>",
 *                    downDom: $('#downcsv'),
 *                    selectDom: $('#selectViewDate'),
 *                    selectStart: $('#selectStart'),
 *                    selectEnd: $('#selectEnd')
 *                });
 */
(function($) {
    $.AdSchedule = function(options) {
        var defaults = {
            // 设定头部显示区
            head: $('#AdHead'),
            // 设定排期表格显示区
            main: $('#AdMain'),
            // 提交处理的URL地址
            postUrl: '',
            // 表格的下载URl地址
            downcsv: '',
            // 表格下载按钮dom
            downDom: $('#downcsv'),
            // 指定日期提交按钮
            selectDom: $('#selectViewDate'),
            // 指定日期开始日期dom
            selectStart: $('#selectStart'),
            // 指定日期结束日期dom
            selectEnd: $('#selectEnd')
        };
        var opts = $.extend({}, defaults, options);

        var Schedule = function() {
            this.sdata = '';
            this.table = '';
            this.currDate = new Date();
            this.currYear = this.currDate.getFullYear();
            this.currMonth = this.currDate.getMonth()+1;
            this.currDay = this.currDate.getDate();

            this.queryData(opts.postUrl, this.currYear, this.currMonth, this.currDay);
        };

        Schedule.prototype = {
            init: function() {
                this.headRender();
                this.mainRender();
                this.bindPrevNext();
            },

            /**
             * @排期表状态栏
             *
             * 填充状态头部内容
             */
            headRender: function() {
                var head = '';
                    head += "<div class='span4'><label class='pull-right'>";
                    head += "<input type='date' name='start' class='span5' id='selectStart' /> 至 <span class='input-append'><input type='date' class='span9' name='end' id='selectEnd' />";
                    head += "<button class='btn' id='selectViewDate'>查看</button></span></label></div>";
                    head += "<div class='span8' style='text-align: right;'><ul><li><i class='linear-color1'></i> 全部售出</li>";
                    head += '<li><i class="linear-color2"></i> 部分售出</li>';
                    /*
                     * head += '<li><i class="linear-color3"></i> 全部预定</li>';
                     * head += '<li><i class="linear-color4"></i> 部分预定</li>';
                     */
                    head += '<li><i class="linear-color5"></i> 空闲</li></ul></div>';
                opts.head.append(head);
            },

            /**
             * @排期表主显示区
             */
            mainRender: function() {
                var position = this._adPosition();
                var dataTable = this._DataTable();
                opts.main.append(position);
                opts.main.append(dataTable);
            },

            /**
             * @绑定上下月按钮事件
             */
            bindPrevNext: function() {
                var self = this;
                $('.prevMonth').live('click', function() {
                    self._bindPrevHandler();
                });
                $('.nextMonth').live('click', function() {
                    self._bindNextHandler();
                });
            },

            /**
             * 广告位填充
             *
             * @returns {string}
             * @private
             */
            _adPosition: function() {
                var html = '<div class="span3"><table class="table table-hover"><thead><tr><th></th></tr><tr><th>广告位名称,</th><th>尺寸</th></tr></thead>';
                    html += '<tbody>'
                    $.each(this.sdata, function(key, dataObj) {
                        html += '<tr><td>'+dataObj['name']+'</td><td>'+dataObj['width']+' * '+dataObj['height']+'</td></tr>';
                    });
                    html += '</tbody></table></div>';

                this.table = html + '{tr}';
                return html;
            },

            /**
             * 数据表格填充
             *
             * @returns {string}
             * @private
             */
            _DataTable: function() {
                var maxDays = this._monthDays(this.currDate.getFullYear(), this.currDate.getMonth()+1);
                var prevNextCols = parseInt((maxDays / 3)/2);
                var middleCols = maxDays - prevNextCols - 4;
                var html = '<div class="span9" style="margin-left: 0px;">';
                    html += '<table class="table table-hover"><thead><tr>';
                    html += '<td colspan="'+prevNextCols+'"><a class="prevMonth">< 上一月</a></td>';
                    html += '<th colspan="'+middleCols+'" style="text-align: center;">'+this.currDate.getFullYear()+'-'+this._changeDateFormat((this.currDate.getMonth()+1))+'</th>';
                    html += '<td colspan="'+prevNextCols+'"><a class="nextMonth">下一月 ></a></td>';
                    html += '</tr></thead>';
                    html += '<tbody><tr class="show-days">';

                for(var num=1; num<=maxDays; num++) {
                    if(num == this.currDate.getDate() && this.currMonth == this.currDate.getMonth()+1) {
                        html += '<td class="currday">'+num+'</td>';
                    }
                    else {
                        html += '<td>'+num+'</td>';
                    }
                }
                    html += '</tr>';

                    html += this._adDataTable(maxDays);

                    html += '</tbody></table></div>';

                this.table += html;

                return html;
            },

            /**
             * 广告数据排期表格填充
             *
             * @returns {string}
             * @private
             */
            _adDataTable: function(maxDays) {
                var html = '';
                var currentTime = this.currDate.getDate();
                var currentMonth = this.currDate.getMonth()+1;
                var self = this;
                // 记录填充当前背景的天数标记
                var currFillNum = 0;

                $.each(this.sdata, function(index, data) {
                    var adNum = data['adNum'];
                    var adposition_id = index;
                    html += '<tr>';

                    $.each(data['adData'][0], function(adIndex, adData) {
                        if(parseInt(adIndex,10) === currentMonth) {
                            for(var num=1; num<=maxDays; num++) {

                                $.each(adData, function($key, $value) {
                                    if(num == $key) {
                                        currFillNum = $key;
                                        var $status = (adNum==$value) ? 0 : 1;
                                        html += self._fillStatus($status, $key, adposition_id);
                                    }
                                });

                                if(num != currFillNum && adIndex == currentMonth) {
                                    html += '<td>&nbsp;</td>';
                                }

                            }
                        }

                    });

                    html += '</tr>';
                });

                return html;
            },

            _fillStatus: function($status, $day, adposition_id) {
                switch($status) {
                    case 0 :
                        return '<td class="all-sell">' +
                        '<a href="javascript:void(0);" title="点击查看详情" now_date="' +
                            this.currDate.getFullYear() +'-'+
                            (this.currDate.getMonth()+1) +'-'+
                            $day +'" adposition_id="'+adposition_id+'" ></a></td>';
                        break;
                    default:
                        return '<td class="parts-sell">' +
                            '<a href="javascript:void(0);" title="点击查看详情" now_date="' +
                            this.currDate.getFullYear() +'-'+
                            (this.currDate.getMonth()+1) +'-'+
                            $day +'" adposition_id="'+adposition_id+'"></a></td>';
                        break;
                }
            },

            _bindPrevHandler: function() {
                var date = new Date();
                var currMonth = date.getMonth()+1;
                var month = this.currDate.getMonth();

                if(currMonth != this.currDate.getMonth()+1) {
                    this.currDate.setMonth(month-1);
                    if(currMonth < month) {
                        this.queryData(opts.postUrl, this.currDate.getFullYear(), this.currDate.getMonth()+1, 1);
                    }
                    else {
                        this.queryData(opts.postUrl, this.currDate.getFullYear(), this.currDate.getMonth()+1, this.currDay);
                    }
                }
                else {
                    this.currDate.setMonth(month);
                    alert('这已经是当前月~~~');
                }

                // 清空并重新绘制
                opts.main.empty();
                this.mainRender();
            },

            _bindNextHandler: function() {
                var month = this.currDate.getMonth();
                this.currDate.setMonth(month+1);

                this.queryData(opts.postUrl, this.currDate.getFullYear(), this.currDate.getMonth()+1, 1);
                // 清空并重新绘制
                opts.main.empty();
                this.mainRender();
            },

            _monthDays: function(year, month) {
                if(month==4||month==6||month==9||month==11) return 30;
                if(month==2) {
                    if(year%4==0 && year%100!=0 || year%400==0) {
                        return 29;
                    }
                    else{
                        return 28;
                    }
                }
                return 31;
            },

            _changeDateFormat: function(month) {
                var month = month<10 ? '0'+month : month;
                return month;
            },

            _setDatas: function(data) {
                this.sdata = data;
            },

            _dateFormat: function myDate(timestamp) {
                var d = new Date(timestamp * 1000);
                var format = d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate();
                return format;
            },

            queryData: function(url, year, month, day) {
                var result = '';
                $.ajax({
                    type: 'POST',
                    url: url,
                    data: {year: year, month: month, day: day},
                    dataType: 'json',
                    async: false,
                    success: function(data) {;
                        result = data;
                    }
                });
                this._setDatas(result);
            }
        };

        // 开始执行
        var obj = new Schedule();
        obj.init();

        // 点击查看详情
        $('tbody td a').live('click', function(event) {
            var date = $(this).attr('now_date');
            var position_id = $(this).attr('adposition_id');
            var offset = $(this).offset();
            var $status, $dl;
            $('.ui-schedule-glass').remove();
            $('.ui-schedule-tip').remove();
            $.ajax({
                type: 'POST',
                url: opts.postUrl,
                data: {date: date, position_id: position_id, details: 'true'},
                dataType: 'json',
                success: function(data) {
                    var html = '<div class="ui-schedule-glass"';
                    html += 'style="left: '+(offset.left+5)+'px; top: '+offset.top+'px; ';
                    html += 'visibility: visible;"></div>';

                    if(offset.left >= (event.clientX/2)+500) {
                        offset.left = offset.left-285;
                    }

                    html += '<div class="ui-schedule-tip" style="left: '+(offset.left)+'px; top: '+(offset.top+29)+'px; visibility: visible;">';
                    html += '<div class="tip-head"><div class="tip-headcntr"></div><a href="javascript:;" class="tip-close"></a></div>';
                    html += '<div class="tip-main" style="height: auto;">';
                    $.each(data, function(index, dataObj) {
                        if(index >= 1) {
                            $dl = '<dl style="border-top: 1px solid #9ECAE8;">';
                        }
                        else {
                            $dl = '<dl>';
                        }

                        if(dataObj.status == 2) {
                            $status = '<dd style="color:red;">预定投放</dd>';
                        }
                        else {
                            $status = '<dd style="color: #46a546;">正在投放</dd>';
                        }

                        html += $dl;
                        html += '<dt>广告名称：</dt>';
                        html += '<dd>'+dataObj.name+'</dd>';
                        html += '<dt>投放时间：</dt>';
                        html += '<dd>'+obj._dateFormat(dataObj.start)+'至'+obj._dateFormat(dataObj.end)+'</dd>';
                        html += '<dt>所属客户：</dt>';
                        html += '<dd>'+dataObj.cName+'</dd>';
                        html += '<dt>投放状态：</dt>';
                        html += $status;
                        html += '</dl>';
                    });
                    html += '</div></div>';

                    opts.main.after(html);
                }
            });
        });

        // 日期查找
        $('#selectViewDate').live('click', function() {
            var start = $('input[id="selectStart"]').val();
            var end = $('input[id="selectEnd"]').val();
            var month = start.split('-');
            obj.currDate.setMonth(month[1]-1);
            var result = '';
            $.ajax({
                type: 'POST',
                url: opts.postUrl,
                data: {start: start, end: end, selectView: 'true'},
                dataType: 'json',
                async: false,
                success: function(data) {;
                    result = data;
                }
            });
            obj._setDatas(result);

            // 清空并重新绘制
            opts.main.empty();
            obj.mainRender();
        });

        /**
         * 下载排期表
         */
        $('#downcsv').live('click', function() {
            $.post(opts.downcsv, {table:obj.table});
        });

        $('.tip-close').live('click', function() {
            $('.ui-schedule-glass').remove();
            $('.ui-schedule-tip').remove();
        });
    };


})(jQuery);
